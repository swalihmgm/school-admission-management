import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamSlot, ExamSlotSchema } from './schemas/exam-slot.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { ExamSlotsController } from './exam-slots.controller';
import { ExamSlotsService } from './exam-slots.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamSlot.name, schema: ExamSlotSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
    AuthModule,
  ],
  controllers: [ExamSlotsController],
  providers: [ExamSlotsService],
  exports: [ExamSlotsService, MongooseModule],
})
export class ExamSlotsModule {}
