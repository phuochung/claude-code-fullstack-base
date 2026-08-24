import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserAdminService } from '../services/user.admin.service';
import { JwtAuthAdminGuard } from 'src/modules/auth/guards/jwt-auth.admin.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { QueryUserDto } from '../dto/query-user.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../enums/user-role.enum';
import { UserRequest } from 'src/shared/decorators/user.decorator';
import { UserResponseDto } from '../dto/user-response.dto';
import { PaginateResult } from 'mongoose';

@UseGuards(JwtAuthAdminGuard, RolesGuard)
@Controller('admin/users')
export class UserAdminController {
  constructor(private readonly userAdminService: UserAdminService) {}

  @Post()
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userAdminService.create(createUserDto);
  }

  @Get()
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  async getPaging(
    @Query() queryDto: QueryUserDto,
  ): Promise<PaginateResult<UserResponseDto>> {
    return this.userAdminService.getPaging(queryDto);
  }

  @Get('profile/me')
  async getProfile(
    @UserRequest() user: { userId: string },
  ): Promise<UserResponseDto> {
    return this.userAdminService.getProfile(user.userId);
  }

  @Patch('profile/me')
  async updateProfile(
    @UserRequest() user: { userId: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userAdminService.updateProfile(user.userId, updateProfileDto);
  }

  @Post('profile/me/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @UserRequest() user: { userId: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    await this.userAdminService.changePassword(user.userId, changePasswordDto);
    return { success: true };
  }

  @Get(':id')
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  async getDetail(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userAdminService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  async update(
    @UserRequest() user: { userId: string },
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userAdminService.update(id, updateUserDto, user.userId);
  }

  @Post(':id/reset-password')
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.userAdminService.resetPassword(id, resetPasswordDto);
    return { success: true };
  }

  @Delete(':id')
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  async delete(
    @UserRequest() user: { userId: string },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.userAdminService.delete(id, user.userId);
    return { success: true };
  }
}
