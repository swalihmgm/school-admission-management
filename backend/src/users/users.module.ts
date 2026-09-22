import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AdminSeedService } from './admin-seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AdminSeedService],
  exports: [MongooseModule, AdminSeedService],
})
export class UsersModule {}
