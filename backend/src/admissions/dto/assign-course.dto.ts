import { IsEnum, IsNotEmpty } from 'class-validator';
import { Grade } from '../../common/enums';

export class AssignCourseDto {
  @IsNotEmpty({ message: 'Assigned grade is required' })
  @IsEnum(Grade, { message: 'Assigned grade must be GRADE_1, GRADE_2, GRADE_3, or GRADE_4' })
  assignedGrade: Grade;
}
