import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class DevSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secretKey = request.headers['x-dev-secret-key'];

    const expectedSecret = process.env.DEV_API_SECRET_KEY;

    if (!expectedSecret) {
      throw new UnauthorizedException(
        'DEV_API_SECRET_KEY is not configured on server',
      );
    }

    if (!secretKey) {
      throw new UnauthorizedException(
        'Missing X-Dev-Secret-Key header. Please provide the secret key in the X-Dev-Secret-Key header.',
      );
    }

    if (secretKey !== expectedSecret) {
      throw new UnauthorizedException('Invalid secret key');
    }

    return true;
  }
}
