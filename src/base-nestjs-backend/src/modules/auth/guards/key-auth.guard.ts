import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Constant-time token comparison. Hash-length is compared first (required by
 * timingSafeEqual); using buffers of the same declared encoding avoids leaking
 * timing information about the expected token's content.
 */
export function tokensMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Factory for static-key bearer guards. The client (website) and internal
 * guards are identical except for the env var holding the expected token, so
 * they share this single implementation.
 */
export function KeyAuthGuard(envVarName: string): Type<CanActivate> {
  @Injectable()
  class KeyAuthGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('common_error.unauthorized');
      }

      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw new UnauthorizedException('common_error.unauthorized');
      }

      const expected = process.env[envVarName];
      if (!expected || !tokensMatch(token, expected)) {
        throw new UnauthorizedException('common_error.unauthorized');
      }

      return true;
    }
  }

  return KeyAuthGuardMixin;
}
