import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ExamSlotStatus } from '../../common/enums';

export type ExamSlotDocument = ExamSlot & Document;

@Schema({ timestamps: true })
export class ExamSlot {
  @Prop({ required: true, type: Date, index: true })
  date: Date;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ required: true, type: Number, min: 1 })
  capacity: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  bookedCount: number;

  @Prop({
    required: true,
    enum: ExamSlotStatus,
    default: ExamSlotStatus.ACTIVE,
    index: true,
  })
  status: ExamSlotStatus;
}

export const ExamSlotSchema = SchemaFactory.createForClass(ExamSlot);

ExamSlotSchema.index({ date: 1, status: 1 });
