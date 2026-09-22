import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ExamSlotStatus } from '../../common/enums';

export class UpdateExamSlotDto {
  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start time must be a valid ISO date string' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End time must be a valid ISO date string' })
  endTime?: string;

  @IsOptional()
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @IsOptional()
  @IsEnum(ExamSlotStatus, { message: 'Status must be ACTIVE or CANCELLED' })
  status?: ExamSlotStatus;
}
