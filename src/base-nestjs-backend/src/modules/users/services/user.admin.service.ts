import { Injectable, BadRequestException } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { UserRepository } from '../user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { COMMON_CONSTANTS } from '../../../shared/constants/constant';
import { FilterQuery } from 'mongoose';
import { BaseSchemaClass } from '../../../shared/base/base.schema';
import * as bcrypt from 'bcrypt';
import { UserRoleEnum } from '../enums/user-role.enum';
import { QueryUserDto } from '../dto/query-user.dto';
import { buildKeywordFilter } from '../../../shared/utils/regex.util';
import { UserStatusEnum } from '../enums/user-status.enum';
import { UserResponseDto } from '../dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginateResult } from 'mongoose';

/**
 * Mongo ids are hex, and hex is case-insensitive: the same account can arrive
 * as `507F1F…` in a URL and `507f1f…` from the JWT. A raw `===` between the two
 * reads as "different user", which would walk straight past the self-write
 * guards below.
 */
/**
 * The hidden role as a plain number. `user.role` and the DTOs type it as
 * `number`, so comparing directly against the enum member trips
 * `no-unsafe-enum-comparison` — the value genuinely is not enum-typed here.
 */
const SUPPER_ADMIN_ROLE: number = UserRoleEnum.SUPPER_ADMIN;

function isSameUser(a?: string, b?: string): boolean {
  return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
}

@Injectable()
export class UserAdminService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * SUPPER_ADMIN is the platform owner's account, not a tenant role. This
   * module manages ordinary staff — ADMIN and below — so a super admin is
   * **not visible here at all**: not listed, not readable, not editable, not
   * deletable, and its password cannot be reset by a tenant admin.
   *
   * That last one is why this is a hard rule and not a counting guard. Without
   * it any ADMIN could reset the owner's password and take the account over;
   * "don't leave zero super admins" would have allowed it.
   *
   * `not_found` rather than a "you may not touch this" message, on purpose: the
   * account is hidden, so from this API's point of view it does not exist.
   */
  private assertNotSupperAdmin(user: { role?: number }): void {
    if (user.role === UserRoleEnum.SUPPER_ADMIN) {
      throw new BadRequestException('admin.user.not_found');
    }
  }

  /**
   * The hidden role cannot be handed out either — otherwise an admin could
   * promote an account into it and then work on it out of sight.
   *
   * `Number()` rather than a bare `===`: the DTO's `@IsEnum` also accepts the
   * enum *name*, and a strict compare against a string value silently misses,
   * leaving the guard resting on class-validator two layers away. Absent and
   * null roles become NaN / 0, neither of which is the hidden role.
   */
  private assertRoleAssignable(role?: number): void {
    if (Number(role) === SUPPER_ADMIN_ROLE) {
      throw new BadRequestException('admin.user.role_not_assignable');
    }
  }

  /** The target of an admin-side write, or `not_found` if it may not be one. */
  private async findManageableUser(_id: string): Promise<User> {
    const user = await this.userRepository.findOne({ _id, deleted: false });
    if (!user) {
      throw new BadRequestException('admin.user.not_found');
    }
    this.assertNotSupperAdmin(user);
    return user;
  }

  async create(userData: CreateUserDto): Promise<UserResponseDto> {
    this.assertRoleAssignable(userData.role);

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      emailLower: userData.email.toLowerCase(),
      deleted: false,
    });
    if (existingUser) {
      throw new BadRequestException('admin.user.email_is_existing');
    }

    // Check if phoneNumber already exists (if provided)
    if (userData.phoneNumber) {
      const existingPhone = await this.userRepository.findOne({
        phoneNumber: userData.phoneNumber,
        deleted: false,
      });
      if (existingPhone) {
        throw new BadRequestException('admin.user.phone_is_existing');
      }
    }

    const user = await this.userRepository.create({
      ...userData,
      status: UserStatusEnum.VERIFIED,
    });

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BadRequestException('admin.user.not_found');
    }
    this.assertNotSupperAdmin(user);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getPaging(
    queryDto: QueryUserDto,
  ): Promise<PaginateResult<UserResponseDto>> {
    const {
      page = 1,
      limit = COMMON_CONSTANTS.ITEMS_PER_PAGE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role,
      keyword,
    } = queryDto;

    const filter: FilterQuery<User & BaseSchemaClass> = { deleted: false };

    // SUPPER_ADMIN is the platform owner's account — never listed here,
    // whatever the caller asks for. Previously the exclusion only applied when
    // no `role` filter was given, so `?role=1` handed it straight back.
    if (role === undefined) {
      filter.role = { $ne: UserRoleEnum.SUPPER_ADMIN };
    } else if (Number(role) === SUPPER_ADMIN_ROLE) {
      // `Number()` for the same reason as assertRoleAssignable: a strict
      // compare against a string `"1"` would miss, and the else-branch below
      // hands the filter to Mongoose, which *does* cast it — listing the
      // account this branch exists to hide.
      // Asked for the hidden role: an empty page, not "everyone else".
      filter.role = { $in: [] };
    } else {
      filter.role = role;
    }

    const keywordFilter = buildKeywordFilter(keyword, [
      'name',
      'email',
      'phoneNumber',
    ]);
    if (keywordFilter) {
      filter.$or = keywordFilter;
    }

    const data = await this.userRepository.paginate(filter, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return {
      ...data,
      docs: data.docs.map((user) =>
        plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  /**
   * `actorId` is the signed-in admin, for the same reason `delete` takes one:
   * an admin editing **their own** row can lock themselves out in one PATCH —
   * `status: BLOCKED`, or a demotion to a role that can no longer reach this
   * screen — and only finds out on the next request. Refusing a self-delete
   * while allowing a self-demote closes half the door.
   *
   * Only *changes* are refused, so the ordinary "fix my own phone number" save
   * still goes through even if the client echoes the current role back.
   * Changing your own name, email or phone is untouched; role and status are
   * the two fields that decide whether you can get back in.
   */
  async update(
    _id: string,
    updateData: UpdateUserDto,
    actorId: string,
  ): Promise<UserResponseDto> {
    const target = await this.findManageableUser(_id);
    this.assertRoleAssignable(updateData.role);

    if (isSameUser(_id, actorId)) {
      if (
        updateData.role !== undefined &&
        Number(updateData.role) !== target.role
      ) {
        throw new BadRequestException('admin.user.cannot_change_own_role');
      }
      if (
        updateData.status !== undefined &&
        Number(updateData.status) !== target.status
      ) {
        throw new BadRequestException('admin.user.cannot_change_own_status');
      }
    }

    // Check if email already exists (if being updated)
    if (updateData.email) {
      const existingUser = await this.userRepository.findOne({
        emailLower: updateData.email.toLowerCase(),
        _id: { $ne: _id },
        deleted: false,
      });
      if (existingUser) {
        throw new BadRequestException('admin.user.email_is_existing');
      }
    }

    // Check if phoneNumber already exists (if being updated)
    if (updateData.phoneNumber) {
      const existingPhone = await this.userRepository.findOne({
        phoneNumber: updateData.phoneNumber,
        _id: { $ne: _id },
        deleted: false,
      });
      if (existingPhone) {
        throw new BadRequestException('admin.user.phone_is_existing');
      }
    }

    const user = await this.userRepository.updateById(_id, updateData);
    if (!user) {
      throw new BadRequestException('admin.user.not_found');
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * `actorId` is the signed-in admin. Deleting yourself is always refused —
   * it is the fastest way to lock yourself out and there is no legitimate
   * reason to do it from this screen.
   */
  async delete(_id: string, actorId: string): Promise<void> {
    if (isSameUser(_id, actorId)) {
      throw new BadRequestException('admin.user.cannot_delete_self');
    }

    await this.findManageableUser(_id);

    const result = await this.userRepository.deleteById(_id);
    if (!result) {
      throw new BadRequestException('admin.user.not_found');
    }
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('admin.user.not_found');
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    // Check if phoneNumber already exists (if being updated)
    if (updateData.phoneNumber) {
      const existingPhone = await this.userRepository.findOne({
        phoneNumber: updateData.phoneNumber,
        _id: { $ne: userId },
        deleted: false,
      });
      if (existingPhone) {
        throw new BadRequestException('admin.user.phone_is_existing');
      }
    }

    const updatedUser = await this.userRepository.updateById(
      userId,
      updateData,
    );
    if (!updatedUser) {
      throw new BadRequestException('admin.user.not_found');
    }
    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<boolean> {
    // `password` has `select: false` on the schema — it must be selected
    // explicitly or bcrypt.compareSync(old, undefined) throws (500).
    const user = await this.userRepository.findOne(
      { _id: userId, deleted: false },
      { select: '+password' },
    );
    if (!user) {
      throw new BadRequestException('admin.user.not_found');
    }

    // Verify old password
    const isPasswordValid = bcrypt.compareSync(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('admin.user.old_password_incorrect');
    }

    // Password will be hashed by the pre('findOneAndUpdate') hook
    await this.userRepository.updateById(userId, {
      password: changePasswordDto.newPassword,
    });

    return true;
  }

  async resetPassword(
    userId: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('admin.user.not_found');
    }
    // Resetting a super admin's password from here would hand a tenant admin
    // the platform owner's account outright.
    this.assertNotSupperAdmin(user);

    // Password will be hashed by the pre('findOneAndUpdate') hook
    await this.userRepository.updateById(userId, {
      password: resetPasswordDto.newPassword,
    });
  }
}
