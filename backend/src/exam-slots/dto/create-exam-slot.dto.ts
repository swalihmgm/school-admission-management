import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateExamSlotDto {
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  date: string;

  @IsNotEmpty({ message: 'Start time is required' })
  @IsDateString({}, { message: 'Start time must be a valid ISO date string' })
  startTime: string;

  @IsNotEmpty({ message: 'End time is required' })
  @IsDateString({}, { message: 'End time must be a valid ISO date string' })
  endTime: string;

  @IsNotEmpty({ message: 'Capacity is required' })
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;
}
