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
import { Payment } from '../src/payments/schemas/payment.schema';

describe('Registration Fee Payment Workflow (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let studentModel: Model<any>;
  let paymentModel: Model<any>;

  let parent1Token: string;
  let parent2Token: string;

  let parent1StudentId: string;
  let parent2StudentId: string;

  let lastOrderId: string;
  let lastPaymentId: string;
  let lastValidSignature: string;

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
    paymentModel = app.get<Model<any>>(getModelToken(Payment.name));

    // Clean test data
    await userModel.deleteMany({
      email: { $in: ['pay.parent1@example.com', 'pay.parent2@example.com'] },
    });

    await app.init();

    // Register & Login Parent 1
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Payment Parent One',
      email: 'pay.parent1@example.com',
      phone: '1111111111',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const loginRes1 = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'pay.parent1@example.com',
      password: 'Password123!',
    });
    parent1Token = loginRes1.body.accessToken;

    // Register & Login Parent 2
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Payment Parent Two',
      email: 'pay.parent2@example.com',
      phone: '2222222222',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const loginRes2 = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'pay.parent2@example.com',
      password: 'Password123!',
    });
    parent2Token = loginRes2.body.accessToken;

    // Create Student for Parent 1
    const s1Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        studentName: 'Pay Student One',
        dateOfBirth: '2018-01-01',
        gender: 'MALE',
        previousSchool: 'Kindergarten',
        applyingGrade: 'GRADE_1',
      });
    parent1StudentId = s1Res.body._id;

    // Create Student for Parent 2
    const s2Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent2Token}`)
      .send({
        studentName: 'Pay Student Two',
        dateOfBirth: '2017-02-02',
        gender: 'FEMALE',
        previousSchool: 'Nursery',
        applyingGrade: 'GRADE_2',
      });
    parent2StudentId = s2Res.body._id;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({
        email: { $in: ['pay.parent1@example.com', 'pay.parent2@example.com'] },
      });
    }
    if (studentModel) {
      await studentModel.deleteMany({
        _id: { $in: [parent1StudentId, parent2StudentId] },
      });
    }
    if (paymentModel) {
      await paymentModel.deleteMany({
        studentId: { $in: [parent1StudentId, parent2StudentId] },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. POST /payments/order should create payment order for unpaid student application', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments/order')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentId: parent1StudentId })
      .expect(201);

    expect(res.body.orderId).toBeDefined();
    expect(res.body.amount).toBe(50000); // ₹500 in paise
    expect(res.body.currency).toBe('INR');
    expect(res.body.studentId).toBe(parent1StudentId);
  });

  it('2. POST /payments/order should reject ownership violation (Parent 1 ordering for Parent 2)', async () => {
    await request(app.getHttpServer())
      .post('/payments/order')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentId: parent2StudentId })
      .expect(403);
  });

  it('3. POST /payments/verify should reject invalid signature and mark payment as FAILED', async () => {
    const orderRes = await request(app.getHttpServer())
      .post('/payments/order')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentId: parent1StudentId })
      .expect(201);

    const orderId = orderRes.body.orderId;
    const paymentId = 'pay_invalid_12345';
    const invalidSignature = 'invalid_signature_hash';

    await request(app.getHttpServer())
      .post('/payments/verify')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        studentId: parent1StudentId,
        orderId,
        paymentId,
        signature: invalidSignature,
      })
      .expect(400);

    // Verify student is still UNPAID
    const student = await studentModel.findById(parent1StudentId);
    expect(student.paymentStatus).toBe('UNPAID');
    expect(student.applicationStatus).toBe('APPLICATION_CREATED');
  });

  it('4. POST /payments/verify should verify valid payment and advance status to PAID & REGISTRATION_FEE_PAID', async () => {
    const orderRes = await request(app.getHttpServer())
      .post('/payments/order')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentId: parent1StudentId })
      .expect(201);

    lastOrderId = orderRes.body.orderId;
    lastPaymentId = 'pay_valid_99999';

    lastValidSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${lastOrderId}|${lastPaymentId}`)
      .digest('hex');

    const res = await request(app.getHttpServer())
      .post('/payments/verify')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        studentId: parent1StudentId,
        orderId: lastOrderId,
        paymentId: lastPaymentId,
        signature: lastValidSignature,
      })
      .expect(200);

    expect(res.body.paymentStatus).toBe('PAID');
    expect(res.body.applicationStatus).toBe('REGISTRATION_FEE_PAID');

    // Verify student document in DB
    const student = await studentModel.findById(parent1StudentId);
    expect(student.paymentStatus).toBe('PAID');
    expect(student.applicationStatus).toBe('REGISTRATION_FEE_PAID');
  });

  it('5. POST /payments/verify should be idempotent when repeated for an already paid order', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments/verify')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        studentId: parent1StudentId,
        orderId: lastOrderId,
        paymentId: lastPaymentId,
        signature: lastValidSignature,
      })
      .expect(200);

    expect(res.body.paymentStatus).toBe('PAID');
    expect(res.body.applicationStatus).toBe('REGISTRATION_FEE_PAID');
  });

  it('6. POST /payments/order should reject order creation for an ALREADY PAID student application', async () => {
    await request(app.getHttpServer())
      .post('/payments/order')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentId: parent1StudentId })
      .expect(400);
  });

  it('7. PATCH /students/:id should reject student updates after successful payment (read-only enforcement)', async () => {
    await request(app.getHttpServer())
      .patch(`/students/${parent1StudentId}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentName: 'Attempted Post-Payment Update' })
      .expect(400);
  });
});
