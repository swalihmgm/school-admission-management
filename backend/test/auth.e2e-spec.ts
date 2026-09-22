import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/users/schemas/user.schema';

describe('Authentication System (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<any>;
  let parentAccessToken: string;
  let parentCookie: string;
  let adminAccessToken: string;

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
    
    // Clean test parent if exists
    await userModel.deleteMany({ email: 'john.parent@example.com' });

    await app.init();
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({ email: 'john.parent@example.com' });
    }
    if (app) {
      await app.close();
    }
  });

  it('1. Admin Seed should have provisioned initial ADMIN account', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@school.com',
        password: 'AdminPassword123!',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.email).toBe('admin@school.com');
    expect(res.body.user.passwordHash).toBeUndefined();

    adminAccessToken = res.body.accessToken;
  });

  it('2. POST /auth/register should register a new PARENT user successfully', async () => {
    const parentData = {
      fullName: 'John Parent',
      email: 'john.parent@example.com',
      phone: '9876543210',
      password: 'ParentPassword123!',
      confirmPassword: 'ParentPassword123!',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(parentData)
      .expect(201);

    expect(res.body.message).toBe('Parent registered successfully');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.user.email).toBe('john.parent@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('3. POST /auth/register should reject duplicate email', async () => {
    const duplicateData = {
      fullName: 'Another Parent',
      email: 'john.parent@example.com',
      phone: '9876543211',
      password: 'ParentPassword123!',
      confirmPassword: 'ParentPassword123!',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(duplicateData)
      .expect(409);

    expect(res.body.message).toBe('Email is already registered');
  });

  it('4. POST /auth/register should reject password mismatch', async () => {
    const invalidData = {
      fullName: 'Test Parent',
      email: 'test.mismatch@example.com',
      phone: '9876543212',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(invalidData)
      .expect(400);
  });

  it('5. POST /auth/login should reject invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'john.parent@example.com',
        password: 'WrongPassword!',
      })
      .expect(401);
  });

  it('6. POST /auth/login should log in parent and return access token & set HttpOnly refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'john.parent@example.com',
        password: 'ParentPassword123!',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.user.passwordHash).toBeUndefined();

    parentAccessToken = res.body.accessToken;

    const cookies = res.get('Set-Cookie');
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true);
    parentCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
  });

  it('7. GET /auth/me should return current user for authenticated parent', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${parentAccessToken}`)
      .expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('john.parent@example.com');
    expect(res.body.user.role).toBe('PARENT');
  });

  it('8. GET /auth/me should reject unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('9. RolesGuard: PARENT should be denied access to ADMIN-only route (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .get('/auth/admin-only')
      .set('Authorization', `Bearer ${parentAccessToken}`)
      .expect(403);
  });

  it('10. RolesGuard: ADMIN should be granted access to ADMIN-only route (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/admin-only')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(res.body.message).toBe('Admin access granted');
  });

  it('11. POST /auth/refresh should issue new access token using valid refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', parentCookie)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('john.parent@example.com');

    parentAccessToken = res.body.accessToken;
    const cookies = res.get('Set-Cookie');
    if (cookies) {
      parentCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    }
  });

  it('12. POST /auth/logout should revoke refresh session and clear cookie', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${parentAccessToken}`)
      .set('Cookie', parentCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', parentCookie)
      .expect(401);
  });
});
