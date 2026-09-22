import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  Gender,
  Grade,
  ApplicationStatus,
  PaymentStatus,
  ExamAttendance,
} from '../../common/enums';
import { User } from '../../users/schemas/user.schema';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  parentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  studentName: string;

  @Prop({ required: true, type: Date })
  dateOfBirth: Date;

  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @Prop({ required: true, trim: true })
  previousSchool: string;

  @Prop({ required: true, enum: Grade })
  applyingGrade: Grade;

  @Prop({
    required: true,
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLICATION_CREATED,
    index: true,
  })
  applicationStatus: ApplicationStatus;

  @Prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Prop({ type: Types.ObjectId, ref: 'ExamSlot', default: null, index: true })
  examSlotId: Types.ObjectId | null;

  @Prop({ type: String, enum: ExamAttendance, default: null })
  examAttendance: ExamAttendance | null;

  @Prop({ type: Number, default: null, min: 0, max: 100 })
  examMarks: number | null;

  @Prop({ type: Date, default: null })
  examResultRecordedAt: Date | null;

  @Prop({ type: String, enum: Grade, default: null })
  assignedGrade: Grade | null;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

StudentSchema.index({ parentId: 1, applicationStatus: 1 });
