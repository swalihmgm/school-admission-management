import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/users/schemas/user.schema';
import { Student } from '../src/students/schemas/student.schema';
import { ExamSlot } from '../src/exam-slots/schemas/exam-slot.schema';

describe('Slot Booking & Rescheduling (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let studentModel: Model<any>;
  let examSlotModel: Model<any>;

  let parent1Token: string;
  let parent2Token: string;
  let adminToken: string;

  let unpaidStudentId: string;
  let paidStudentId: string;
  let parent2StudentId: string;

  let activeSlot1Id: string;
  let activeSlot2Id: string;
  let fullSlotId: string;
  let cancelledSlotId: string;
  let pastSlotId: string;
  let singleCapacitySlotId: string;

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
    studentModel = app.get<Model<any>>(getModelToken(Student.name));
    examSlotModel = app.get<Model<any>>(getModelToken(ExamSlot.name));

    // Clean test data
    await userModel.deleteMany({
      email: { $in: ['book.parent1@example.com', 'book.parent2@example.com'] },
    });

    await app.init();

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@school.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.accessToken;

    // Register & Login Parent 1
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Booking Parent One',
      email: 'book.parent1@example.com',
      phone: '1111111111',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const loginRes1 = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'book.parent1@example.com',
      password: 'Password123!',
    });
    parent1Token = loginRes1.body.accessToken;

    // Register & Login Parent 2
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Booking Parent Two',
      email: 'book.parent2@example.com',
      phone: '2222222222',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const loginRes2 = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'book.parent2@example.com',
      password: 'Password123!',
    });
    parent2Token = loginRes2.body.accessToken;

    // Create Unpaid Student for Parent 1
    const unRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        studentName: 'Unpaid Student',
        dateOfBirth: '2018-01-01',
        gender: 'MALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_1',
      });
    unpaidStudentId = unRes.body._id;

    // Create Paid Student for Parent 1 (Simulate PAID status in DB)
    const paidRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        studentName: 'Paid Student',
        dateOfBirth: '2018-02-02',
        gender: 'FEMALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_1',
      });
    paidStudentId = paidRes.body._id;
    await studentModel.findByIdAndUpdate(paidStudentId, {
      paymentStatus: 'PAID',
      applicationStatus: 'REGISTRATION_FEE_PAID',
    });

    // Create Paid Student for Parent 2
    const p2Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent2Token}`)
      .send({
        studentName: 'Parent 2 Student',
        dateOfBirth: '2017-03-03',
        gender: 'MALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_2',
      });
    parent2StudentId = p2Res.body._id;
    await studentModel.findByIdAndUpdate(parent2StudentId, {
      paymentStatus: 'PAID',
      applicationStatus: 'REGISTRATION_FEE_PAID',
    });

    // Create Test Exam Slots via Admin
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const slot1Res = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: futureDate.toISOString(),
        startTime: new Date(futureDate.getTime() + 1000 * 3600 * 9).toISOString(),
        endTime: new Date(futureDate.getTime() + 1000 * 3600 * 11).toISOString(),
        capacity: 10,
      });
    activeSlot1Id = slot1Res.body._id;

    const slot2Res = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: futureDate.toISOString(),
        startTime: new Date(futureDate.getTime() + 1000 * 3600 * 14).toISOString(),
        endTime: new Date(futureDate.getTime() + 1000 * 3600 * 16).toISOString(),
        capacity: 10,
      });
    activeSlot2Id = slot2Res.body._id;

    // Full Slot (capacity 2, bookedCount 2)
    const fullRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: futureDate.toISOString(),
        startTime: new Date(futureDate.getTime() + 1000 * 3600 * 17).toISOString(),
        endTime: new Date(futureDate.getTime() + 1000 * 3600 * 19).toISOString(),
        capacity: 2,
      });
    fullSlotId = fullRes.body._id;
    await examSlotModel.findByIdAndUpdate(fullSlotId, { bookedCount: 2 });

    // Cancelled Slot
    const cancelRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: futureDate.toISOString(),
        startTime: new Date(futureDate.getTime() + 1000 * 3600 * 20).toISOString(),
        endTime: new Date(futureDate.getTime() + 1000 * 3600 * 22).toISOString(),
        capacity: 5,
      });
    cancelledSlotId = cancelRes.body._id;
    await examSlotModel.findByIdAndUpdate(cancelledSlotId, { status: 'CANCELLED' });

    // Past Slot
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: pastDate.toISOString(),
        startTime: new Date(pastDate.getTime() + 1000 * 3600 * 9).toISOString(),
        endTime: new Date(pastDate.getTime() + 1000 * 3600 * 11).toISOString(),
        capacity: 5,
      });
    pastSlotId = pastRes.body._id;

    // Single Capacity Slot for Concurrency Test (capacity 1)
    const singleRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: futureDate.toISOString(),
        startTime: new Date(futureDate.getTime() + 1000 * 3600 * 12).toISOString(),
        endTime: new Date(futureDate.getTime() + 1000 * 3600 * 13).toISOString(),
        capacity: 1,
      });
    singleCapacitySlotId = singleRes.body._id;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({
        email: { $in: ['book.parent1@example.com', 'book.parent2@example.com'] },
      });
    }
    if (studentModel) {
      await studentModel.deleteMany({
        _id: { $in: [unpaidStudentId, paidStudentId, parent2StudentId] },
      });
    }
    if (examSlotModel) {
      await examSlotModel.deleteMany({
        _id: {
          $in: [
            activeSlot1Id,
            activeSlot2Id,
            fullSlotId,
            cancelledSlotId,
            pastSlotId,
            singleCapacitySlotId,
          ],
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. POST /students/:id/exam-slot should reject unpaid application (400 Bad Request)', async () => {
    await request(app.getHttpServer())
      .post(`/students/${unpaidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: activeSlot1Id })
      .expect(400);
  });

  it('2. POST /students/:id/exam-slot should reject ownership violation (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .post(`/students/${parent2StudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: activeSlot1Id })
      .expect(403);
  });

  it('3. POST /students/:id/exam-slot should reject ADMIN role access (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ slotId: activeSlot1Id })
      .expect(403);
  });

  it('4. POST /students/:id/exam-slot should reject full, cancelled, or past slots', async () => {
    // Full slot
    await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: fullSlotId })
      .expect(409);

    // Cancelled slot
    await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: cancelledSlotId })
      .expect(409);

    // Past slot
    await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: pastSlotId })
      .expect(400);
  });

  it('5. POST /students/:id/exam-slot should successfully book active slot for paid student', async () => {
    const res = await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: activeSlot1Id })
      .expect(200);

    expect(res.body.student.examSlotId).toBe(activeSlot1Id);
    expect(res.body.student.applicationStatus).toBe('SLOT_BOOKED');

    // Verify slot bookedCount incremented in DB
    const slot = await examSlotModel.findById(activeSlot1Id);
    expect(slot.bookedCount).toBe(1);
  });

  it('6. POST /students/:id/exam-slot should allow rescheduling to another active slot before exam start', async () => {
    const res = await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: activeSlot2Id })
      .expect(200);

    expect(res.body.student.examSlotId).toBe(activeSlot2Id);

    // Old slot bookedCount decremented
    const oldSlot = await examSlotModel.findById(activeSlot1Id);
    expect(oldSlot.bookedCount).toBe(0);

    // New slot bookedCount incremented
    const newSlot = await examSlotModel.findById(activeSlot2Id);
    expect(newSlot.bookedCount).toBe(1);
  });

  it('7. POST /students/:id/exam-slot failed rescheduling should preserve original booking intact', async () => {
    // Try rescheduling to fullSlotId
    await request(app.getHttpServer())
      .post(`/students/${paidStudentId}/exam-slot`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ slotId: fullSlotId })
      .expect(409);

    // Original booking (activeSlot2Id) must remain intact
    const student = await studentModel.findById(paidStudentId);
    expect(student.examSlotId.toString()).toBe(activeSlot2Id);

    const slot2 = await examSlotModel.findById(activeSlot2Id);
    expect(slot2.bookedCount).toBe(1);
  });

  it('8. Concurrency Test: Simultaneous requests for final single capacity slot', async () => {
    // Parent 1 (paidStudentId) and Parent 2 (parent2StudentId) both try booking singleCapacitySlotId at the exact same moment
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post(`/students/${paidStudentId}/exam-slot`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({ slotId: singleCapacitySlotId }),
      request(app.getHttpServer())
        .post(`/students/${parent2StudentId}/exam-slot`)
        .set('Authorization', `Bearer ${parent2Token}`)
        .send({ slotId: singleCapacitySlotId }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    const singleSlot = await examSlotModel.findById(singleCapacitySlotId);
    expect(singleSlot.bookedCount).toBe(1); // Capacity of 1 never exceeded!
  });
});
