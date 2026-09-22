import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, MongooseModule],
})
export class PaymentsModule {}
