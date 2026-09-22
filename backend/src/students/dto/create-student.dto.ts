import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Gender, Grade } from '../../common/enums';

export class CreateStudentDto {
  @IsNotEmpty({ message: 'Student name is required' })
  @IsString()
  studentName: string;

  @IsNotEmpty({ message: 'Date of birth is required' })
  @IsDateString({}, { message: 'Date of birth must be a valid ISO date string' })
  dateOfBirth: string;

  @IsNotEmpty({ message: 'Gender is required' })
  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender: Gender;

  @IsNotEmpty({ message: 'Previous school is required' })
  @IsString()
  previousSchool: string;

  @IsNotEmpty({ message: 'Applying grade is required' })
  @IsEnum(Grade, { message: 'Applying grade must be GRADE_1, GRADE_2, GRADE_3, or GRADE_4' })
  applyingGrade: Grade;
}
