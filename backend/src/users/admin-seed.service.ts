import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../common/enums';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  async seedAdminUser() {
    const adminEmail = this.configService.get<string>('admin.email');
    const adminPassword = this.configService.get<string>('admin.password');
    const adminFullName = this.configService.get<string>('admin.fullName');

    if (!adminEmail || !adminPassword) {
      this.logger.warn('Admin seed credentials not provided in environment variables.');
      return;
    }

    try {
      const existingAdmin = await this.userModel.findOne({ email: adminEmail.toLowerCase() });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await this.userModel.create({
          fullName: adminFullName || 'Admission Team Admin',
          email: adminEmail.toLowerCase(),
          phone: '0000000000',
          passwordHash,
          role: UserRole.ADMIN,
        });
        this.logger.log(`Provisioned initial ADMIN user: ${adminEmail}`);
      } else {
        this.logger.log(`ADMIN user already provisioned: ${adminEmail}`);
      }
    } catch (err: any) {
      if (err.code === 11000) {
        this.logger.log(`ADMIN user already exists (E11000 caught): ${adminEmail}`);
      } else {
        throw err;
      }
    }
  }
}
