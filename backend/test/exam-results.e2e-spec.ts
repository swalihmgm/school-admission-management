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

describe('Exam Result & Attendance Workflow (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let studentModel: Model<any>;
  let examSlotModel: Model<any>;

  let adminToken: string;
  let parentToken: string;

  let bookedStudent1Id: string;
  let bookedStudent2Id: string;
  let unbookedStudentId: string;
  let slotId: string;

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

    // Clean test parent
    await userModel.deleteMany({ email: 'result.parent@example.com' });

    await app.init();

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@school.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.accessToken;

    // Register & Login Parent
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Result Parent',
      email: 'result.parent@example.com',
      phone: '4444444444',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const parentLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'result.parent@example.com',
      password: 'Password123!',
    });
    parentToken = parentLoginRes.body.accessToken;

    // Create Test Slot
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const slotRes = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: futureDate.toISOString(),
        startTime: new Date(futureDate.getTime() + 1000 * 3600 * 9).toISOString(),
        endTime: new Date(futureDate.getTime() + 1000 * 3600 * 11).toISOString(),
        capacity: 10,
      });
    slotId = slotRes.body._id;

    // Create Booked Student 1 (Simulate PAID & SLOT_BOOKED status)
    const s1Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentName: 'Result Student One',
        dateOfBirth: '2018-01-01',
        gender: 'MALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_1',
      });
    bookedStudent1Id = s1Res.body._id;

    await studentModel.findByIdAndUpdate(bookedStudent1Id, {
      paymentStatus: 'PAID',
      applicationStatus: 'SLOT_BOOKED',
      examSlotId: slotId,
    });

    // Create Booked Student 2
    const s2Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentName: 'Result Student Two',
        dateOfBirth: '2017-02-02',
        gender: 'FEMALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_2',
      });
    bookedStudent2Id = s2Res.body._id;

    await studentModel.findByIdAndUpdate(bookedStudent2Id, {
      paymentStatus: 'PAID',
      applicationStatus: 'SLOT_BOOKED',
      examSlotId: slotId,
    });

    // Create Unbooked Student
    const unRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentName: 'Unbooked Student',
        dateOfBirth: '2018-03-03',
        gender: 'MALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_1',
      });
    unbookedStudentId = unRes.body._id;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({ email: 'result.parent@example.com' });
    }
    if (studentModel) {
      await studentModel.deleteMany({
        _id: { $in: [bookedStudent1Id, bookedStudent2Id, unbookedStudentId] },
      });
    }
    if (examSlotModel) {
      await examSlotModel.findByIdAndDelete(slotId);
    }
    if (app) {
      await app.close();
    }
  });

  it('1. PATCH /admissions/:id/exam-result should reject unauthorized parent access (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ examAttendance: 'PRESENT', examMarks: 85 })
      .expect(403);
  });

  it('2. PATCH /admissions/:id/exam-result should reject unbooked student (400 Bad Request)', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${unbookedStudentId}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'PRESENT', examMarks: 85 })
      .expect(400);
  });

  it('3. PATCH /admissions/:id/exam-result should reject PRESENT without marks', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'PRESENT' })
      .expect(400);
  });

  it('4. PATCH /admissions/:id/exam-result should reject marks below 0 or above 100', async () => {
    // Marks < 0
    await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'PRESENT', examMarks: -10 })
      .expect(400);

    // Marks > 100
    await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'PRESENT', examMarks: 105 })
      .expect(400);
  });

  it('5. PATCH /admissions/:id/exam-result should reject ABSENT with numeric marks', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'ABSENT', examMarks: 50 })
      .expect(400);
  });

  it('6. PATCH /admissions/:id/exam-result should successfully record PRESENT with 0 marks', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'PRESENT', examMarks: 0 })
      .expect(200);

    expect(res.body.examAttendance).toBe('PRESENT');
    expect(res.body.examMarks).toBe(0);
    expect(res.body.applicationStatus).toBe('EXAM_COMPLETED');
    expect(res.body.examResultRecordedAt).toBeDefined();
  });

  it('7. PATCH /admissions/:id/exam-result should allow ADMIN to edit an existing exam result to 100 marks', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent1Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'PRESENT', examMarks: 100 })
      .expect(200);

    expect(res.body.examAttendance).toBe('PRESENT');
    expect(res.body.examMarks).toBe(100);
    expect(res.body.applicationStatus).toBe('EXAM_COMPLETED');
  });

  it('8. PATCH /admissions/:id/exam-result should successfully record ABSENT with null marks', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${bookedStudent2Id}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ examAttendance: 'ABSENT' })
      .expect(200);

    expect(res.body.examAttendance).toBe('ABSENT');
    expect(res.body.examMarks).toBeNull();
    expect(res.body.applicationStatus).toBe('EXAM_COMPLETED');
    expect(res.body.examResultRecordedAt).toBeDefined();
  });
});
