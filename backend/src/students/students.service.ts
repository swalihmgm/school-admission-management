import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ApplicationStatus, PaymentStatus, UserRole } from '../common/enums';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
  ) {}

  async createStudent(parentId: string, dto: CreateStudentDto) {
    const student = await this.studentModel.create({
      parentId: new Types.ObjectId(parentId),
      studentName: dto.studentName.trim(),
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      previousSchool: dto.previousSchool.trim(),
      applyingGrade: dto.applyingGrade,
      applicationStatus: ApplicationStatus.APPLICATION_CREATED,
      paymentStatus: PaymentStatus.UNPAID,
    });
    return student;
  }

  async getParentStudents(parentId: string) {
    return this.studentModel
      .find({ parentId: new Types.ObjectId(parentId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStudentById(
    studentId: string,
    currentUser: { userId: string; role: UserRole },
  ) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new NotFoundException('Invalid student application ID format');
    }

    const student = await this.studentModel.findById(studentId).exec();
    if (!student) {
      throw new NotFoundException('Student application not found');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      student.parentId.toString() !== currentUser.userId
    ) {
      throw new ForbiddenException(
        'You do not have access to this student application',
      );
    }

    return student;
  }

  async updateStudent(
    studentId: string,
    parentId: string,
    dto: UpdateStudentDto,
  ) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new NotFoundException('Invalid student application ID format');
    }

    const student = await this.studentModel.findById(studentId).exec();
    if (!student) {
      throw new NotFoundException('Student application not found');
    }

    if (student.parentId.toString() !== parentId) {
      throw new ForbiddenException(
        'You do not have access to edit this student application',
      );
    }

    if (
      student.paymentStatus === PaymentStatus.PAID ||
      student.applicationStatus !== ApplicationStatus.APPLICATION_CREATED
    ) {
      throw new BadRequestException(
        'Student details cannot be updated after registration fee payment has been completed',
      );
    }

    if (dto.studentName !== undefined) student.studentName = dto.studentName.trim();
    if (dto.dateOfBirth !== undefined) student.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) student.gender = dto.gender;
    if (dto.previousSchool !== undefined) student.previousSchool = dto.previousSchool.trim();
    if (dto.applyingGrade !== undefined) student.applyingGrade = dto.applyingGrade;

    return student.save();
  }
}
