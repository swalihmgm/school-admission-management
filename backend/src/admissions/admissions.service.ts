import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UpdateExamResultDto } from './dto/update-exam-result.dto';
import { AssignCourseDto } from './dto/assign-course.dto';
import { ApplicationStatus, ExamAttendance, UserRole } from '../common/enums';

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getParentsList() {
    const parents = await this.userModel
      .find({ role: UserRole.PARENT })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .exec();

    const parentIds = parents.map((p) => p._id);
    const students = await this.studentModel
      .find({ parentId: { $in: parentIds } })
      .select('_id studentName applyingGrade applicationStatus paymentStatus parentId')
      .exec();

    return parents.map((p) => {
      const pObj = p.toObject();
      const myStudents = students.filter(
        (s) => s.parentId.toString() === p._id.toString(),
      );
      return {
        ...pObj,
        studentsCount: myStudents.length,
        students: myStudents,
      };
    });
  }

  async updateExamResult(studentId: string, dto: UpdateExamResultDto) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new NotFoundException('Invalid student application ID format');
    }

    const student = await this.studentModel.findById(studentId).exec();
    if (!student) {
      throw new NotFoundException('Student application not found');
    }

    if (
      student.applicationStatus === ApplicationStatus.APPLICATION_CREATED ||
      student.applicationStatus === ApplicationStatus.REGISTRATION_FEE_PAID ||
      !student.examSlotId
    ) {
      throw new BadRequestException(
        'Student application must have a booked exam slot before recording results',
      );
    }

    if (student.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED) {
      throw new BadRequestException(
        'Exam result cannot be modified after admission completion',
      );
    }

    if (dto.examAttendance === ExamAttendance.PRESENT) {
      if (dto.examMarks === undefined || dto.examMarks === null) {
        throw new BadRequestException(
          'Marks are required when exam attendance is PRESENT',
        );
      }
      if (
        typeof dto.examMarks !== 'number' ||
        dto.examMarks < 0 ||
        dto.examMarks > 100
      ) {
        throw new BadRequestException(
          'Marks must be an integer between 0 and 100 inclusive',
        );
      }
      student.examAttendance = ExamAttendance.PRESENT;
      student.examMarks = dto.examMarks;
    } else if (dto.examAttendance === ExamAttendance.ABSENT) {
      if (dto.examMarks !== undefined && dto.examMarks !== null) {
        throw new BadRequestException(
          'Marks must be null when exam attendance is ABSENT',
        );
      }
      student.examAttendance = ExamAttendance.ABSENT;
      student.examMarks = null;
    }

    student.examResultRecordedAt = new Date();
    student.applicationStatus = ApplicationStatus.EXAM_COMPLETED;

    return student.save();
  }

  async assignCourse(studentId: string, dto: AssignCourseDto) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new NotFoundException('Invalid student application ID format');
    }

    const student = await this.studentModel.findById(studentId).exec();
    if (!student) {
      throw new NotFoundException('Student application not found');
    }

    if (
      student.applicationStatus !== ApplicationStatus.EXAM_COMPLETED &&
      student.applicationStatus !== ApplicationStatus.ADMISSION_COMPLETED
    ) {
      throw new BadRequestException(
        'Student application must complete the entrance exam stage before course/grade assignment',
      );
    }

    if (student.examAttendance === ExamAttendance.ABSENT) {
      throw new BadRequestException(
        'Cannot assign a grade/course to a student recorded as ABSENT',
      );
    }

    student.assignedGrade = dto.assignedGrade;
    student.applicationStatus = ApplicationStatus.ADMISSION_COMPLETED;

    return student.save();
  }

  async getAdmissionsList(status?: ApplicationStatus) {
    const filter: any = {};
    if (status) {
      filter.applicationStatus = status;
    }
    return this.studentModel
      .find(filter)
      .populate('parentId', 'fullName email phone')
      .sort({ updatedAt: -1 })
      .exec();
  }
}
