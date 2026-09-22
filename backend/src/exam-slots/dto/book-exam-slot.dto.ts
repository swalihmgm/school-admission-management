import { IsNotEmpty, IsString } from 'class-validator';

export class BookExamSlotDto {
  @IsNotEmpty({ message: 'Exam slot ID is required' })
  @IsString()
  slotId: string;
}
