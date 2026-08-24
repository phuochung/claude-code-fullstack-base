import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../../users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route (or a whole controller) to the given admin roles.
 * Must be combined with JwtAuthAdminGuard + RolesGuard.
 */
export const Roles = (...roles: UserRoleEnum[]) =>
  SetMetadata(ROLES_KEY, roles);
