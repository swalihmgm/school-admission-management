import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamSlot, ExamSlotDocument } from './schemas/exam-slot.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { CreateExamSlotDto } from './dto/create-exam-slot.dto';
import { UpdateExamSlotDto } from './dto/update-exam-slot.dto';
import { BookExamSlotDto } from './dto/book-exam-slot.dto';
import {
  ApplicationStatus,
  ExamSlotStatus,
  PaymentStatus,
  UserRole,
} from '../common/enums';

@Injectable()
export class ExamSlotsService {
  constructor(
    @InjectModel(ExamSlot.name)
    private readonly examSlotModel: Model<ExamSlotDocument>,
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
  ) {}

  async createSlot(dto: CreateExamSlotDto) {
    const slotDate = new Date(dto.date);
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (isNaN(slotDate.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date or time format provided');
    }

    if (start >= end) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const newSlot = await this.examSlotModel.create({
      date: slotDate,
      startTime: start,
      endTime: end,
      capacity: dto.capacity,
      bookedCount: 0,
      status: ExamSlotStatus.ACTIVE,
    });

    return newSlot;
  }

  async updateSlot(slotId: string, dto: UpdateExamSlotDto) {
    if (!Types.ObjectId.isValid(slotId)) {
      throw new NotFoundException('Invalid exam slot ID format');
    }

    const slot = await this.examSlotModel.findById(slotId).exec();
    if (!slot) {
      throw new NotFoundException('Exam slot not found');
    }

    const targetStart = dto.startTime ? new Date(dto.startTime) : slot.startTime;
    const targetEnd = dto.endTime ? new Date(dto.endTime) : slot.endTime;

    if (targetStart >= targetEnd) {
      throw new BadRequestException('startTime must be before endTime');
    }

    if (dto.capacity !== undefined) {
      if (dto.capacity < slot.bookedCount) {
        throw new BadRequestException(
          `Capacity cannot be reduced below the current booked count of ${slot.bookedCount}`,
        );
      }
      slot.capacity = dto.capacity;
    }

    if (dto.date !== undefined) slot.date = new Date(dto.date);
    if (dto.startTime !== undefined) slot.startTime = targetStart;
    if (dto.endTime !== undefined) slot.endTime = targetEnd;
    if (dto.status !== undefined) slot.status = dto.status;

    return slot.save();
  }

  async getAvailableSlots(userRole?: UserRole) {
    const filter: any = { status: ExamSlotStatus.ACTIVE };

    // If Parent, show active slots where capacity is not full
    if (userRole === UserRole.PARENT) {
      filter.$expr = { $lt: ['$bookedCount', '$capacity'] };
    }

    const slots = await this.examSlotModel
      .find(filter)
      .sort({ date: 1, startTime: 1 })
      .exec();

    return slots;
  }

  async getAllSlotsForAdmin() {
    return this.examSlotModel
      .find()
      .sort({ date: 1, startTime: 1 })
      .exec();
  }

  async getSlotById(slotId: string) {
    if (!Types.ObjectId.isValid(slotId)) {
      throw new NotFoundException('Invalid exam slot ID format');
    }
    const slot = await this.examSlotModel.findById(slotId).exec();
    if (!slot) {
      throw new NotFoundException('Exam slot not found');
    }
    return slot;
  }

  async bookOrRescheduleSlot(
    studentId: string,
    parentId: string,
    dto: BookExamSlotDto,
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
        'You do not have access to this student application',
      );
    }

    if (student.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Payment of registration fee is required before booking an exam slot',
      );
    }

    if (
      student.applicationStatus === ApplicationStatus.EXAM_COMPLETED ||
      student.applicationStatus === ApplicationStatus.ADMISSION_COMPLETED
    ) {
      throw new BadRequestException(
        'Slot booking cannot be changed after exam completion',
      );
    }

    if (!Types.ObjectId.isValid(dto.slotId)) {
      throw new NotFoundException('Invalid exam slot ID format');
    }

    const requestedSlot = await this.examSlotModel.findById(dto.slotId).exec();
    if (!requestedSlot) {
      throw new NotFoundException('Requested exam slot not found');
    }

    if (requestedSlot.status === ExamSlotStatus.CANCELLED) {
      throw new ConflictException('Requested exam slot has been cancelled');
    }

    const now = new Date();
    if (now >= new Date(requestedSlot.startTime)) {
      throw new BadRequestException(
        'Cannot book an exam slot in the past or after start time',
      );
    }

    // Check if already booked for the exact same slot
    if (
      student.examSlotId &&
      student.examSlotId.toString() === requestedSlot._id.toString()
    ) {
      return {
        statusCode: 200,
        message: 'Already booked for this exam slot',
        student,
        slot: requestedSlot,
      };
    }

    // If rescheduling, check if currently booked slot start time has already passed
    let oldSlotId: Types.ObjectId | null = null;
    if (student.examSlotId) {
      const currentSlot = await this.examSlotModel.findById(student.examSlotId).exec();
      if (currentSlot) {
        if (now >= new Date(currentSlot.startTime)) {
          throw new BadRequestException(
            'Cannot reschedule slot after the scheduled exam start time',
          );
        }
        oldSlotId = currentSlot._id;
      }
    }

    // Atomic capacity acquisition of NEW slot
    const acquiredSlot = await this.examSlotModel.findOneAndUpdate(
      {
        _id: requestedSlot._id,
        status: ExamSlotStatus.ACTIVE,
        $expr: { $lt: ['$bookedCount', '$capacity'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true },
    );

    if (!acquiredSlot) {
      throw new ConflictException('Requested exam slot is full or unavailable');
    }

    // Safely release old slot if rescheduling
    if (oldSlotId) {
      await this.examSlotModel.findByIdAndUpdate(oldSlotId, {
        $inc: { bookedCount: -1 },
      });
    }

    // Update Student document
    student.examSlotId = acquiredSlot._id;
    student.applicationStatus = ApplicationStatus.SLOT_BOOKED;
    await student.save();

    return {
      statusCode: 200,
      message: oldSlotId ? 'Slot rescheduled successfully' : 'Slot booked successfully',
      student,
      slot: acquiredSlot,
    };
  }
}
