import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentOrderDto {
  @IsNotEmpty({ message: 'Student application ID is required' })
  @IsString()
  studentId: string;
}
