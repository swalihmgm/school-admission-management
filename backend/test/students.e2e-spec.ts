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

describe('Student Application Module (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let studentModel: Model<any>;

  let parent1Token: string;
  let parent2Token: string;
  let adminToken: string;

  let parent1Student1Id: string;
  let parent1Student2Id: string;
  let parent2StudentId: string;

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

    // Clean test data
    await userModel.deleteMany({
      email: { $in: ['student.parent1@example.com', 'student.parent2@example.com'] },
    });

    await app.init();

    // Register & Login Parent 1
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Parent One',
      email: 'student.parent1@example.com',
      phone: '1111111111',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const loginRes1 = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'student.parent1@example.com',
      password: 'Password123!',
    });
    parent1Token = loginRes1.body.accessToken;

    // Register & Login Parent 2
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Parent Two',
      email: 'student.parent2@example.com',
      phone: '2222222222',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const loginRes2 = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'student.parent2@example.com',
      password: 'Password123!',
    });
    parent2Token = loginRes2.body.accessToken;

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@school.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.accessToken;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({
        email: { $in: ['student.parent1@example.com', 'student.parent2@example.com'] },
      });
    }
    if (studentModel) {
      await studentModel.deleteMany({
        _id: { $in: [parent1Student1Id, parent1Student2Id, parent2StudentId] },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. POST /students should create student application for authenticated parent', async () => {
    const studentData = {
      studentName: 'Alice ParentOne',
      dateOfBirth: '2018-05-15',
      gender: 'FEMALE',
      previousSchool: 'Sunshine Kindergarten',
      applyingGrade: 'GRADE_1',
    };

    const res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send(studentData)
      .expect(201);

    expect(res.body._id).toBeDefined();
    expect(res.body.studentName).toBe('Alice ParentOne');
    expect(res.body.gender).toBe('FEMALE');
    expect(res.body.applyingGrade).toBe('GRADE_1');
    expect(res.body.applicationStatus).toBe('APPLICATION_CREATED');
    expect(res.body.paymentStatus).toBe('UNPAID');

    parent1Student1Id = res.body._id;
  });

  it('2. POST /students should allow creating a second application for the same parent (no quota limit)', async () => {
    const studentData2 = {
      studentName: 'Bob ParentOne',
      dateOfBirth: '2016-08-20',
      gender: 'MALE',
      previousSchool: 'St. Mary School',
      applyingGrade: 'GRADE_3',
    };

    const res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send(studentData2)
      .expect(201);

    expect(res.body._id).toBeDefined();
    expect(res.body.studentName).toBe('Bob ParentOne');
    parent1Student2Id = res.body._id;
  });

  it('3. POST /students should reject invalid grade or gender (validation failure)', async () => {
    const invalidData = {
      studentName: 'Charlie Test',
      dateOfBirth: '2017-01-01',
      gender: 'INVALID_GENDER',
      previousSchool: 'Test School',
      applyingGrade: 'GRADE_10', // V1 only supports GRADE_1..4
    };

    await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send(invalidData)
      .expect(400);
  });

  it('4. POST /students should deny ADMIN role from creating student application (403 Forbidden)', async () => {
    const studentData = {
      studentName: 'Admin Child',
      dateOfBirth: '2017-01-01',
      gender: 'MALE',
      previousSchool: 'None',
      applyingGrade: 'GRADE_1',
    };

    await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(studentData)
      .expect(403);
  });

  it('5. GET /students should list only the authenticated parent applications', async () => {
    // First, Parent 2 creates an application
    const p2Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parent2Token}`)
      .send({
        studentName: 'David ParentTwo',
        dateOfBirth: '2017-03-10',
        gender: 'MALE',
        previousSchool: 'Little Stars Preschool',
        applyingGrade: 'GRADE_2',
      })
      .expect(201);

    parent2StudentId = p2Res.body._id;

    // Parent 1 fetches their applications
    const p1List = await request(app.getHttpServer())
      .get('/students')
      .set('Authorization', `Bearer ${parent1Token}`)
      .expect(200);

    expect(Array.isArray(p1List.body)).toBe(true);
    expect(p1List.body.length).toBe(2);
    const names = p1List.body.map((s: any) => s.studentName);
    expect(names).toContain('Alice ParentOne');
    expect(names).toContain('Bob ParentOne');
    expect(names).not.toContain('David ParentTwo');
  });

  it('6. GET /students/:id should allow parent to view their own application', async () => {
    const res = await request(app.getHttpServer())
      .get(`/students/${parent1Student1Id}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .expect(200);

    expect(res.body._id).toBe(parent1Student1Id);
    expect(res.body.studentName).toBe('Alice ParentOne');
  });

  it('7. GET /students/:id should reject parent viewing another parent application (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .get(`/students/${parent2StudentId}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .expect(403);
  });

  it('8. GET /students/:id should allow ADMIN to view any student application', async () => {
    const res = await request(app.getHttpServer())
      .get(`/students/${parent1Student1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body._id).toBe(parent1Student1Id);
    expect(res.body.studentName).toBe('Alice ParentOne');
  });

  it('9. PATCH /students/:id should allow parent to update details before payment', async () => {
    const updateData = {
      previousSchool: 'Updated Sunshine Academy',
      applyingGrade: 'GRADE_2',
    };

    const res = await request(app.getHttpServer())
      .patch(`/students/${parent1Student1Id}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.previousSchool).toBe('Updated Sunshine Academy');
    expect(res.body.applyingGrade).toBe('GRADE_2');
  });

  it('10. PATCH /students/:id should reject parent updating another parent application (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .patch(`/students/${parent2StudentId}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentName: 'Hacked Name' })
      .expect(403);
  });

  it('11. PATCH /students/:id should reject updates after payment (post-payment editing restriction)', async () => {
    // Simulate paid status directly in DB for testing restriction
    await studentModel.findByIdAndUpdate(parent1Student1Id, {
      paymentStatus: 'PAID',
      applicationStatus: 'REGISTRATION_FEE_PAID',
    });

    const res = await request(app.getHttpServer())
      .patch(`/students/${parent1Student1Id}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ studentName: 'Attempted Post Payment Name Change' })
      .expect(400);

    expect(res.body.message).toContain('cannot be updated after registration fee payment');
  });
});
