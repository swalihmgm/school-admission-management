import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExamSlotsService } from './exam-slots.service';
import { CreateExamSlotDto } from './dto/create-exam-slot.dto';
import { UpdateExamSlotDto } from './dto/update-exam-slot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('exam-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamSlotsController {
  constructor(private readonly examSlotsService: ExamSlotsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAvailableSlots(@CurrentUser() user: any) {
    return this.examSlotsService.getAvailableSlots(user?.role);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllSlotsForAdmin() {
    return this.examSlotsService.getAllSlotsForAdmin();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSlot(@Body() dto: CreateExamSlotDto) {
    return this.examSlotsService.createSlot(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateSlot(
    @Param('id') id: string,
    @Body() dto: UpdateExamSlotDto,
  ) {
    return this.examSlotsService.updateSlot(id, dto);
  }
}
