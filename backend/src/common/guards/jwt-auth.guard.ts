import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('jwt.accessSecret');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      // Attach user payload to request
      request.user = {
        userId: payload.sub,
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
