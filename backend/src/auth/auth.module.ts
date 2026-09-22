import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RefreshSession, RefreshSessionSchema } from './schemas/refresh-session.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: RefreshSession.name, schema: RefreshSessionSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
