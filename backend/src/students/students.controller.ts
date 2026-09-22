import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { ExamSlotsService } from '../exam-slots/exam-slots.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BookExamSlotDto } from '../exam-slots/dto/book-exam-slot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly examSlotsService: ExamSlotsService,
  ) {}

  @Post()
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.CREATED)
  async createStudent(
    @CurrentUser() user: any,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.createStudent(user.userId || user.id, dto);
  }

  @Get()
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  async getStudents(@CurrentUser() user: any) {
    return this.studentsService.getParentStudents(user.userId || user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getStudentById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.getStudentById(id, {
      userId: user.userId || user.id,
      role: user.role,
    });
  }

  @Patch(':id')
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  async updateStudent(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateStudent(id, user.userId || user.id, dto);
  }

  @Post(':id/exam-slot')
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  async bookExamSlot(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: BookExamSlotDto,
  ) {
    return this.examSlotsService.bookOrRescheduleSlot(
      id,
      user.userId || user.id,
      dto,
    );
  }
}
