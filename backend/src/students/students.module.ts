import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from './schemas/student.schema';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { AuthModule } from '../auth/auth.module';
import { ExamSlotsModule } from '../exam-slots/exam-slots.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema }]),
    AuthModule,
    ExamSlotsModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService, MongooseModule],
})
export class StudentsModule {}
