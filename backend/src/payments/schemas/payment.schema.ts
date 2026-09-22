import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RazorpayPaymentStatus } from '../../common/enums';
import { Student } from '../../students/schemas/student.schema';
import { User } from '../../users/schemas/user.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: Student.name, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  parentId: Types.ObjectId;

  @Prop({ required: true, type: Number, default: 500 })
  amount: number;

  @Prop({ required: true, trim: true, default: 'INR' })
  currency: string;

  @Prop({ required: true, trim: true, default: 'RAZORPAY' })
  provider: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  orderId: string;

  @Prop({ type: String, default: null, trim: true, sparse: true, index: true })
  paymentId: string | null;

  @Prop({ type: String, default: null, trim: true })
  signature: string | null;

  @Prop({
    required: true,
    enum: RazorpayPaymentStatus,
    default: RazorpayPaymentStatus.CREATED,
  })
  status: RazorpayPaymentStatus;

  @Prop({ type: Date, default: null })
  verifiedAt: Date | null;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ studentId: 1, parentId: 1 });
