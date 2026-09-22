import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsNotEmpty({ message: 'Student application ID is required' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'Razorpay order ID is required' })
  @IsString()
  orderId: string;

  @IsNotEmpty({ message: 'Razorpay payment ID is required' })
  @IsString()
  paymentId: string;

  @IsNotEmpty({ message: 'Razorpay signature is required' })
  @IsString()
  signature: string;
}
