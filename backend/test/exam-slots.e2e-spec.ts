import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/users/schemas/user.schema';
import { ExamSlot } from '../src/exam-slots/schemas/exam-slot.schema';

describe('Exam Slot Management Module (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let examSlotModel: Model<any>;

  let adminToken: string;
  let parentToken: string;

  let createdSlotId: string;
  let fullSlotId: string;
  let cancelledSlotId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    userModel = app.get<Model<any>>(getModelToken(User.name));
    examSlotModel = app.get<Model<any>>(getModelToken(ExamSlot.name));

    // Clean test parent user
    await userModel.deleteMany({ email: 'slot.parent@example.com' });

    await app.init();

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@school.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.accessToken;

    // Register & Login Parent
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Slot Parent',
      email: 'slot.parent@example.com',
      phone: '3333333333',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const parentLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'slot.parent@example.com',
      password: 'Password123!',
    });
    parentToken = parentLoginRes.body.accessToken;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({ email: 'slot.parent@example.com' });
    }
    if (examSlotModel) {
      await examSlotModel.deleteMany({
        _id: { $in: [createdSlotId, fullSlotId, cancelledSlotId] },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. POST /exam-slots should allow ADMIN to create valid exam slot', async () => {
    const slotData = {
      date: '2026-10-15T00:00:00.000Z',
      startTime: '2026-10-15T09:00:00.000Z',
      endTime: '2026-10-15T11:00:00.000Z',
      capacity: 25,
    };

    const res = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slotData)
      .expect(201);

    expect(res.body._id).toBeDefined();
    expect(res.body.capacity).toBe(25);
    expect(res.body.bookedCount).toBe(0);
    expect(res.body.status).toBe('ACTIVE');

    createdSlotId = res.body._id;
  });

  it('2. POST /exam-slots should deny PARENT from creating exam slot (403 Forbidden)', async () => {
    const slotData = {
      date: '2026-10-16T00:00:00.000Z',
      startTime: '2026-10-16T09:00:00.000Z',
      endTime: '2026-10-16T11:00:00.000Z',
      capacity: 10,
    };

    await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${parentToken}`)
      .send(slotData)
      .expect(403);
  });

  it('3. POST /exam-slots should reject startTime >= endTime (validation failure)', async () => {
    const invalidSlot = {
      date: '2026-10-15T00:00:00.000Z',
      startTime: '2026-10-15T11:00:00.000Z',
      endTime: '2026-10-15T09:00:00.000Z', // endTime is before startTime
      capacity: 10,
    };

    await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidSlot)
      .expect(400);
  });

  it('4. POST /exam-slots should reject capacity < 1 (validation failure)', async () => {
    const invalidSlot = {
      date: '2026-10-15T00:00:00.000Z',
      startTime: '2026-10-15T09:00:00.000Z',
      endTime: '2026-10-15T11:00:00.000Z',
      capacity: 0,
    };

    await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidSlot)
      .expect(400);
  });

  it('5. PATCH /exam-slots/:id should allow ADMIN to update slot capacity and time', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/exam-slots/${createdSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 30 })
      .expect(200);

    expect(res.body.capacity).toBe(30);
  });

  it('6. PATCH /exam-slots/:id should deny PARENT from updating slot (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .patch(`/exam-slots/${createdSlotId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ capacity: 50 })
      .expect(403);
  });

  it('7. PATCH /exam-slots/:id should prevent reducing capacity below current bookedCount', async () => {
    // Simulate slot with 5 bookings directly in DB
    await examSlotModel.findByIdAndUpdate(createdSlotId, { bookedCount: 5 });

    await request(app.getHttpServer())
      .patch(`/exam-slots/${createdSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 3 }) // Attempts to set capacity to 3 when bookedCount is 5
      .expect(400);
  });

  it('8. PATCH /exam-slots/:id should allow ADMIN to cancel a slot (status = CANCELLED)', async () => {
    // Create a slot to cancel
    const cancelRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: '2026-10-20T00:00:00.000Z',
        startTime: '2026-10-20T10:00:00.000Z',
        endTime: '2026-10-20T12:00:00.000Z',
        capacity: 15,
      })
      .expect(201);

    cancelledSlotId = cancelRes.body._id;

    const res = await request(app.getHttpServer())
      .patch(`/exam-slots/${cancelledSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' })
      .expect(200);

    expect(res.body.status).toBe('CANCELLED');
  });

  it('9. GET /exam-slots should return active available slots for PARENT and exclude full or cancelled slots', async () => {
    // Create a full slot (bookedCount == capacity)
    const fullRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: '2026-10-25T00:00:00.000Z',
        startTime: '2026-10-25T14:00:00.000Z',
        endTime: '2026-10-25T16:00:00.000Z',
        capacity: 2,
      })
      .expect(201);

    fullSlotId = fullRes.body._id;
    await examSlotModel.findByIdAndUpdate(fullSlotId, { bookedCount: 2 });

    // Fetch slots as PARENT
    const res = await request(app.getHttpServer())
      .get('/exam-slots')
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const returnedIds = res.body.map((s: any) => s._id);

    // Should include createdSlotId (capacity 30, bookedCount 5)
    expect(returnedIds).toContain(createdSlotId);

    // Should EXCLUDE fullSlotId and cancelledSlotId for parents
    expect(returnedIds).not.toContain(fullSlotId);
    expect(returnedIds).not.toContain(cancelledSlotId);
  });
});
