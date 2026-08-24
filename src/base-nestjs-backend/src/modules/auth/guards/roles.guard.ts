import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRoleEnum } from '../../users/enums/user-role.enum';
import { UserRepository } from '../../users/user.repository';

/**
 * Role-based authorization. Runs AFTER JwtAuthAdminGuard (which attaches
 * `request.user.userId`). The JWT payload does not carry the role, so the
 * current role is read from the database — this also means a demoted user
 * loses access immediately, without waiting for token expiry.
 *
 * Routes without a @Roles() decorator are unaffected.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRoleEnum[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { userId?: string } }>();
    const userId = request.user?.userId;
    if (!userId) {
      throw new ForbiddenException('common_error.forbidden');
    }

    const user = await this.userRepository.findOne({
      _id: userId,
      deleted: false,
    });
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('common_error.forbidden');
    }

    return true;
  }
}
