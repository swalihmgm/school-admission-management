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

describe('Course / Grade Assignment Workflow (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let studentModel: Model<any>;

  let adminToken: string;
  let parentToken: string;

  let presentExamStudentId: string;
  let absentExamStudentId: string;
  let unexamStudentId: string;

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

    // Clean test parent
    await userModel.deleteMany({ email: 'course.parent@example.com' });

    await app.init();

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@school.com',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.accessToken;

    // Register & Login Parent
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Course Parent',
      email: 'course.parent@example.com',
      phone: '5555555555',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const parentLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'course.parent@example.com',
      password: 'Password123!',
    });
    parentToken = parentLoginRes.body.accessToken;

    // Create Present Exam Completed Student
    const s1Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentName: 'Course Student One',
        dateOfBirth: '2018-01-01',
        gender: 'MALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_1',
      });
    presentExamStudentId = s1Res.body._id;

    await studentModel.findByIdAndUpdate(presentExamStudentId, {
      paymentStatus: 'PAID',
      applicationStatus: 'EXAM_COMPLETED',
      examAttendance: 'PRESENT',
      examMarks: 88,
    });

    // Create Absent Exam Completed Student
    const s2Res = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentName: 'Course Student Two',
        dateOfBirth: '2017-02-02',
        gender: 'FEMALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_2',
      });
    absentExamStudentId = s2Res.body._id;

    await studentModel.findByIdAndUpdate(absentExamStudentId, {
      paymentStatus: 'PAID',
      applicationStatus: 'EXAM_COMPLETED',
      examAttendance: 'ABSENT',
      examMarks: null,
    });

    // Create Unexam Student (SLOT_BOOKED)
    const unRes = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentName: 'Unexam Student',
        dateOfBirth: '2018-03-03',
        gender: 'MALE',
        previousSchool: 'School',
        applyingGrade: 'GRADE_1',
      });
    unexamStudentId = unRes.body._id;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({ email: 'course.parent@example.com' });
    }
    if (studentModel) {
      await studentModel.deleteMany({
        _id: { $in: [presentExamStudentId, absentExamStudentId, unexamStudentId] },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. PATCH /admissions/:id/course should reject PARENT role access (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${presentExamStudentId}/course`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ assignedGrade: 'GRADE_1' })
      .expect(403);
  });

  it('2. PATCH /admissions/:id/course should reject grade assignment before EXAM_COMPLETED', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${unexamStudentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_1' })
      .expect(400);
  });

  it('3. PATCH /admissions/:id/course should reject grade assignment for ABSENT student', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${absentExamStudentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_2' })
      .expect(400);
  });

  it('4. PATCH /admissions/:id/course should reject invalid grade value', async () => {
    await request(app.getHttpServer())
      .patch(`/admissions/${presentExamStudentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_10' }) // Unsupported grade
      .expect(400);
  });

  it('5. PATCH /admissions/:id/course should allow ADMIN to assign valid grade and advance status to ADMISSION_COMPLETED', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${presentExamStudentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_1' })
      .expect(200);

    expect(res.body.assignedGrade).toBe('GRADE_1');
    expect(res.body.applicationStatus).toBe('ADMISSION_COMPLETED');

    // Verify database document
    const student = await studentModel.findById(presentExamStudentId);
    expect(student.assignedGrade).toBe('GRADE_1');
    expect(student.applicationStatus).toBe('ADMISSION_COMPLETED');
  });

  it('6. PATCH /admissions/:id/course should allow ADMIN to update assigned grade', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admissions/${presentExamStudentId}/course`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedGrade: 'GRADE_2' })
      .expect(200);

    expect(res.body.assignedGrade).toBe('GRADE_2');
    expect(res.body.applicationStatus).toBe('ADMISSION_COMPLETED');
  });
});
