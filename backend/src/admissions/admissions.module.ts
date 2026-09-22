import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
