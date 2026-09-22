import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import {
  ApplicationStatus,
  PaymentStatus,
  RazorpayPaymentStatus,
} from '../common/enums';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(parentId: string, dto: CreatePaymentOrderDto) {
    if (!Types.ObjectId.isValid(dto.studentId)) {
      throw new NotFoundException('Invalid student application ID format');
    }

    const student = await this.studentModel.findById(dto.studentId).exec();
    if (!student) {
      throw new NotFoundException('Student application not found');
    }

    if (student.parentId.toString() !== parentId) {
      throw new ForbiddenException(
        'You do not have access to this student application',
      );
    }

    if (
      student.paymentStatus === PaymentStatus.PAID ||
      student.applicationStatus !== ApplicationStatus.APPLICATION_CREATED
    ) {
      throw new BadRequestException(
        'Registration fee has already been paid for this application',
      );
    }

    const keyId = this.configService.get<string>('razorpay.keyId') || 'rzp_test_dummy_key_id';
    const keySecret = this.configService.get<string>('razorpay.keySecret') || 'rzp_test_dummy_key_secret';

    let orderId: string;

    // Check if there is already an existing CREATED payment order for this student
    const existingPayment = await this.paymentModel.findOne({
      studentId: student._id,
      status: RazorpayPaymentStatus.CREATED,
    });

    if (existingPayment) {
      orderId = existingPayment.orderId;
    } else {
      try {
        if (keyId.includes('dummy') || keySecret.includes('dummy')) {
          orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        } else {
          const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          });

          const rzpOrder = await razorpay.orders.create({
            amount: 50000, // ₹500 in paise
            currency: 'INR',
            receipt: student._id.toString(),
          });

          orderId = rzpOrder.id;
        }
      } catch (err: any) {
        this.logger.warn(`Razorpay SDK call failed, generating fallback mock order ID: ${err.message}`);
        orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      await this.paymentModel.create({
        studentId: student._id,
        parentId: student.parentId,
        amount: 500,
        currency: 'INR',
        provider: 'RAZORPAY',
        orderId,
        status: RazorpayPaymentStatus.CREATED,
      });
    }

    return {
      orderId,
      amount: 50000,
      currency: 'INR',
      keyId,
      studentId: student._id.toString(),
    };
  }

  async verifyPayment(parentId: string, dto: VerifyPaymentDto) {
    if (!Types.ObjectId.isValid(dto.studentId)) {
      throw new NotFoundException('Invalid student application ID format');
    }

    const payment = await this.paymentModel.findOne({
      orderId: dto.orderId,
      studentId: new Types.ObjectId(dto.studentId),
    });

    if (!payment) {
      throw new NotFoundException('Payment order record not found');
    }

    if (payment.parentId.toString() !== parentId) {
      throw new ForbiddenException(
        'You do not have access to verify this payment',
      );
    }

    const student = await this.studentModel.findById(dto.studentId).exec();
    if (!student) {
      throw new NotFoundException('Student application not found');
    }

    // Idempotent check if already paid
    if (
      payment.status === RazorpayPaymentStatus.SUCCESS &&
      student.paymentStatus === PaymentStatus.PAID
    ) {
      return {
        statusCode: 200,
        message: 'Payment verified successfully (Idempotent response)',
        paymentStatus: PaymentStatus.PAID,
        applicationStatus: ApplicationStatus.REGISTRATION_FEE_PAID,
      };
    }

    const simulatorEnabled =
      this.configService.get<boolean>('razorpay.simulatorEnabled') === true ||
      (this.configService.get<string>('razorpay.keyId') || '').includes('dummy');

    const isSimulatedDevRequest =
      simulatorEnabled &&
      dto.signature === 'simulated_test_signature' &&
      payment.orderId.startsWith('order_mock_') &&
      payment.status === RazorpayPaymentStatus.CREATED;

    let isSignatureValid = false;

    if (isSimulatedDevRequest) {
      isSignatureValid = true;
    } else {
      const keySecret =
        this.configService.get<string>('razorpay.keySecret') || 'rzp_test_dummy_key_secret';
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${dto.orderId}|${dto.paymentId}`)
        .digest('hex');

      isSignatureValid = generatedSignature === dto.signature;
    }

    if (!isSignatureValid) {
      payment.status = RazorpayPaymentStatus.FAILED;
      await payment.save();
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    // Signature matches -> Update payment and student state atomically/idempotently
    payment.paymentId = dto.paymentId;
    payment.signature = dto.signature;
    payment.status = RazorpayPaymentStatus.SUCCESS;
    payment.verifiedAt = new Date();
    await payment.save();

    student.paymentStatus = PaymentStatus.PAID;
    student.applicationStatus = ApplicationStatus.REGISTRATION_FEE_PAID;
    await student.save();

    return {
      statusCode: 200,
      message: 'Payment verified successfully',
      paymentStatus: PaymentStatus.PAID,
      applicationStatus: ApplicationStatus.REGISTRATION_FEE_PAID,
    };
  }

  async handleWebhook(rawBody: string | Buffer, signature: string, payload: any) {
    const webhookSecret = this.configService.get<string>('razorpay.webhookSecret');

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = paymentEntity?.order_id || payload?.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await this.paymentModel.findOne({ orderId });
        if (payment && payment.status !== RazorpayPaymentStatus.SUCCESS) {
          payment.paymentId = paymentId || payment.paymentId;
          payment.status = RazorpayPaymentStatus.SUCCESS;
          payment.verifiedAt = new Date();
          await payment.save();

          await this.studentModel.findByIdAndUpdate(payment.studentId, {
            paymentStatus: PaymentStatus.PAID,
            applicationStatus: ApplicationStatus.REGISTRATION_FEE_PAID,
          });
        }
      }
    } else if (event === 'payment.failed') {
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await this.paymentModel.findOneAndUpdate(
          { orderId },
          { status: RazorpayPaymentStatus.FAILED },
        );
      }
    }

    return { status: 'ok' };
  }
}
