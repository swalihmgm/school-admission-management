import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('frontendUrl') || 'http://localhost:3000';
  const port = configService.get<number>('port') || 3001;

  // Use cookie parser for HttpOnly refresh tokens
  app.use(cookieParser());

  // Dynamic CORS restricted to configured frontend URLs (supports comma-separated origins)
  const allowedOrigins = frontendUrl
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  // Global Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Handling
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  console.log(`Backend is running on port ${port}`);
}
bootstrap();
