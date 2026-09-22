import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { ExamSlotsModule } from './exam-slots/exam-slots.module';
import { PaymentsModule } from './payments/payments.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    ExamSlotsModule,
    PaymentsModule,
    AdmissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
