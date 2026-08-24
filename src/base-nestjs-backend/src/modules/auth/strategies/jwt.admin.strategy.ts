import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  COMMON_CONSTANTS,
  getJwtSecret,
} from '../../../shared/constants/constant';
import { Request } from 'express';
import { AuthAdminService } from '../services/auth.admin.service';
import { UserRepository } from '../../users/user.repository';
import { UserStatusEnum } from '../../users/enums/user-status.enum';

interface AdminJwtPayload {
  userId?: string;
  name?: string;
  email?: string;
}

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwtAdmin') {
  constructor(
    private authAdminService: AuthAdminService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      // Custom JWT extractor: try cookie first, then Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try to extract from httpOnly cookie (for dashboard)
        (request: Request) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return request?.cookies
            ? request.cookies[COMMON_CONSTANTS.COOKIE_NAME]
            : null;
        },
        // 2. Fallback to Authorization header (for web/mobile clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  /**
   * Re-check the user in the database on every request (mirrors RolesGuard):
   * a deleted or blocked admin loses access immediately instead of keeping a
   * valid token until it expires.
   */
  async validate(payload: AdminJwtPayload): Promise<{
    userId: string;
    name?: string;
    email?: string;
  }> {
    const userId = payload?.userId;
    if (!userId) {
      throw new UnauthorizedException('common_error.unauthorized');
    }

    const user = await this.userRepository.findOne({
      _id: userId,
      deleted: false,
    });
    if (!user || (user.status as UserStatusEnum) !== UserStatusEnum.VERIFIED) {
      throw new UnauthorizedException('common_error.unauthorized');
    }

    this.authAdminService.updateLastActive(userId).catch(() => {});
    return { userId, name: payload.name, email: payload.email };
  }
}
