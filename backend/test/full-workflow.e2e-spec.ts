import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/users/schemas/user.schema';
import { Student } from '../src/students/schemas/student.schema';
import { ExamSlot } from '../src/exam-slots/schemas/exam-slot.schema';
import { Payment } from '../src/payments/schemas/payment.schema';

describe('Complete Backend Admission Full Workflow Verification (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let studentModel: Model<any>;
  let examSlotModel: Model<any>;
  let paymentModel: Model<any>;

  let parentToken: string;
  let adminToken: string;
  let studentId: string;
  let slotId: string;
  let orderId: string;

  const testKeySecret = 'rzp_test_dummy_key_secret';

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
    paymentModel = app.get<Model<any>>(getModelToken(Payment.name));

    // Clean test parent user
    await userModel.deleteMany({ email: 'full.workflow@example.com' });

    await app.init();
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({ email: 'full.workflow@example.com' });
    }
    if (studentModel && studentId) {
      await studentModel.findByIdAndDelete(studentId);
    }
    if (examSlotModel && slotId) {
      await examSlotModel.findByIdAndDelete(slotId);
    }
    if (paymentModel && studentId) {
      await paymentModel.deleteMany({ studentId });
    }
    if (app) {
      await app.close();
    }
  });

  it('Step 1: Parent Registration and Login', async () => {
    // 1.1 Register Parent
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Full Workflow Parent',
        email: 'full.workflow@example.com',
        phone: '9998887776',
        password: 'WorkflowPassword123!',
        confirmPassword: 'WorkflowPassword123!',
      })
      .expect(201);

    expect(regRes.body.user.role).toBe('PARENT');
    expect(regRes.body.user.email).toBe('full.workflow@example.com');
    expect(regRes.body.user.passwordHash).toBeUndefined();

    // 1.2 Login Parent
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'full.workflow@example.com',
        password: 'WorkflowPassword123!',
      })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    parentToken = loginRes.body.accessToken;

    // 1.3 Login Admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@school.com',
        password: 'AdminPassword123!',
      })
      .expect(200);

    expect(adminLoginRes.body.accessToken).toBeDefined();
    adminToken = adminLoginRes.body.accessToken;
  });

  it('Step 2: Create Student Application & Verify Initial State (APPLICATION_CREATED & UNPAID)', async () => {
    const studentData = {
      studentName: 'Full Journey Student',
      dateOfBirth: '2018-04-12',
      gender: 'MALE',
      previousSchool: 'Primary Nursery',
      applyingGrade: 'GRADE_1',
    };

    const res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send(studentData)
      .expect(201);

    expect(res.body._id).toBeDefined();
    expect(res.body.studentName).toBe('Full Journey Student');
    expect(res.body.applicationStatus).toBe('APPLICATION_CREATED');
    expect(res.body.paymentStatus).toBe('UNPAID');

    studentId = res.body._id;
  });

  it('Step 3: ADMIN creates Exam Slot', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    const slotData = {
      date: futureDate.toISOString(),
      startTime: new Date(futureDate.getTime() + 1000 * 3600 * 9).toISOString(),
      endTime: new Date(futureDate.getTime() + 1000 * 3600 * 11).toISOString(),
      capacity: 5,
    };

    const res = await request(app.getHttpServer())
      .post('/exam-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slotData)
      .expect(201);

    expect(res.body._id).toBeDefined();
    expect(res.body.capacity).toBe(5);
    expect(res.body.bookedCount).toBe(0);
    expect(res.body.status).toBe('ACTIVE');

    slotId = res.body._id;
  });

  it('Step 4: Attempting to Book Slot Before Payment should fail (No skipping steps)', async () => {
    await request(app.getHttpServer())
      .post(`/students/${studentId}/exam-slot`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slotId })
      .expect(400);
  });

  it('Step 5: Registration Fee Payment Order & Server Verification (REGISTRATION_FEE_PAID)', async () => {
    // 5.1 Create Order
    const orderRes = await request(app.getHttpServer())
      .post('/payments/order')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId })
      .expect(201);

    expect(orderRes.body.orderId).toBeDefined();
    expect(orderRes.body.amount).toBe(50000); // ₹500 in paise
    orderId = orderRes.body.orderId;

    const paymentId = 'pay_full_journey_123';
    const validSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // 5.2 Verify Payment
    const verifyRes = await request(app.getHttpServer())
      .post('/payments/verify')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentId,
        orderId,
        paymentId,
        signature: validSignature,
      })
      .expect(200);

    expect(verifyRes.body.paymentStatus).toBe('PAID');
    expect(verifyRes.body.applicationStatus).toBe('REGISTRATION_FEE_PAID');

    // 5.3 Verify Student Details become READ-ONLY after payment
    await request(app.getHttpServer())
      .patch(`/students/${studentId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentName: 'Attempted Post-Payment Name Change' })
      .expect(400);
  });

  it('Step 6: Parent Books Exam Slot (SLOT_BOOKED)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/students/${studentId}/exam-slot`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slotId })
      .expect(200);

    expect(res.body.student.examSlotId).toBe(slotId);
    expect(res.body.student.applicationStatus).toBe('SLOT_BOOKED');

    // Verify slot capacity incremented in DB
    const slot = await examSlotModel.findById(slotId);
    expect(slot.bookedCount).toBe(1);
  });

  it('Step 7: Attempting Grade Assignment Before Exam Results should fail (No skipping steps)', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${studentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_1' })
      .expect(400);
  });

  it('Step 8: ADMIN Records Exam Result & Attendance (EXAM_COMPLETED)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${studentId}/exam-result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examAttendance: 'PRESENT',
        examMarks: 92,
      })
      .expect(200);

    expect(res.body.examAttendance).toBe('PRESENT');
    expect(res.body.examMarks).toBe(92);
    expect(res.body.applicationStatus).toBe('EXAM_COMPLETED');
    expect(res.body.examResultRecordedAt).toBeDefined();
  });

  it('Step 9: ADMIN Assigns Final Grade & Completes Admission (ADMISSION_COMPLETED)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${studentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_1' })
      .expect(200);

    expect(res.body.assignedGrade).toBe('GRADE_1');
    expect(res.body.applicationStatus).toBe('ADMISSION_COMPLETED');
  });

  it('Step 10: Final Verification of Student Document & Complete Workflow State Integrity', async () => {
    const res = await request(app.getHttpServer())
      .get(`/students/${studentId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    const student = res.body;
    expect(student.studentName).toBe('Full Journey Student');
    expect(student.paymentStatus).toBe('PAID');
    expect(student.applicationStatus).toBe('ADMISSION_COMPLETED');
    expect(student.examSlotId).toBe(slotId);
    expect(student.examAttendance).toBe('PRESENT');
    expect(student.examMarks).toBe(92);
    expect(student.examResultRecordedAt).toBeDefined();
    expect(student.assignedGrade).toBe('GRADE_1');
  });
});
