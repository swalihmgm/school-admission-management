import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  RefreshSession,
  RefreshSessionDocument,
} from './schemas/refresh-session.schema';
import { RegisterParentDto } from './dto/register-parent.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public sanitizeUser(user: UserDocument | User & { _id: Types.ObjectId | string }) {
    return {
      id: user._id ? user._id.toString() : (user as any).id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  async registerParent(dto: RegisterParentDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.userModel.create({
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      passwordHash,
      role: UserRole.PARENT, // Public registration strictly creates PARENT
    });

    return {
      statusCode: 201,
      message: 'Parent registered successfully',
      user: this.sanitizeUser(newUser),
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase().trim(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthSession(user, res);
  }

  async refreshToken(rawRefreshToken: string, res: Response) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const cleanToken = rawRefreshToken.split(';')[0].trim();

    const activeSessions = await this.refreshSessionModel
      .find({
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .sort({ _id: -1 })
      .limit(20);

    let matchedSession: RefreshSessionDocument | null = null;
    for (const session of activeSessions) {
      const isMatch = await bcrypt.compare(cleanToken, session.tokenHash);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid, expired, or revoked refresh session');
    }

    // Revoke old session (Rotation)
    matchedSession.revokedAt = new Date();
    await matchedSession.save();

    const user = await this.userModel.findById(matchedSession.userId);
    if (!user) {
      throw new UnauthorizedException('Associated user account not found');
    }

    return this.createAuthSession(user, res);
  }

  async logout(rawRefreshToken: string, res: Response, userId?: string) {
    if (rawRefreshToken) {
      const cleanToken = rawRefreshToken.split(';')[0].trim();
      const filter: any = {
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      };
      if (userId && Types.ObjectId.isValid(userId)) {
        filter.userId = new Types.ObjectId(userId);
      }

      const activeSessions = await this.refreshSessionModel
        .find(filter)
        .sort({ _id: -1 })
        .limit(20);

      for (const session of activeSessions) {
        const isMatch = await bcrypt.compare(cleanToken, session.tokenHash);
        if (isMatch) {
          session.revokedAt = new Date();
          await session.save();
          break;
        }
      }
    }

    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    res.clearCookie('refreshToken', {
      path: '/auth',
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    return {
      statusCode: 200,
      message: 'Logged out successfully',
    };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { user: this.sanitizeUser(user) };
  }

  private async createAuthSession(user: UserDocument, res: Response) {
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const accessExpiresIn = this.configService.get<string>(
      'jwt.accessExpiresIn',
    ) || '15m';

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      },
    );

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshSessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });

    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }
}
