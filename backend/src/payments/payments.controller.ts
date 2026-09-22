import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @CurrentUser() user: any,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createOrder(user.userId || user.id, dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @CurrentUser() user: any,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.userId || user.id, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any,
  ) {
    const rawBody = (req as any).rawBody || JSON.stringify(payload);
    return this.paymentsService.handleWebhook(rawBody, signature, payload);
  }
}
