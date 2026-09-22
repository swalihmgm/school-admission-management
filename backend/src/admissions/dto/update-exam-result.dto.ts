import { IsEnum, IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { ExamAttendance } from '../../common/enums';

export class UpdateExamResultDto {
  @IsNotEmpty({ message: 'Exam attendance is required' })
  @IsEnum(ExamAttendance, { message: 'Attendance must be PRESENT or ABSENT' })
  examAttendance: ExamAttendance;

  @IsOptional()
  @IsInt({ message: 'Marks must be an integer' })
  @Min(0, { message: 'Marks must be at least 0' })
  @Max(100, { message: 'Marks cannot exceed 100' })
  examMarks?: number | null;
}
