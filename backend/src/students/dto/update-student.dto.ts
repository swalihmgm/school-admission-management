import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender, Grade } from '../../common/enums';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid ISO date string' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender?: Gender;

  @IsOptional()
  @IsString()
  previousSchool?: string;

  @IsOptional()
  @IsEnum(Grade, { message: 'Applying grade must be GRADE_1, GRADE_2, GRADE_3, or GRADE_4' })
  applyingGrade?: Grade;
}
