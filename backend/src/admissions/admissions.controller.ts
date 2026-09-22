import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { UpdateExamResultDto } from './dto/update-exam-result.dto';
import { AssignCourseDto } from './dto/assign-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApplicationStatus, UserRole } from '../common/enums';

@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAdmissionsList(@Query('status') status?: ApplicationStatus) {
    return this.admissionsService.getAdmissionsList(status);
  }

  @Get('parents')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getParentsList() {
    return this.admissionsService.getParentsList();
  }

  @Patch(':id/exam-result')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateExamResult(
    @Param('id') id: string,
    @Body() dto: UpdateExamResultDto,
  ) {
    return this.admissionsService.updateExamResult(id, dto);
  }

  @Patch(':id/course')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async assignCourse(
    @Param('id') id: string,
    @Body() dto: AssignCourseDto,
  ) {
    return this.admissionsService.assignCourse(id, dto);
  }
}
