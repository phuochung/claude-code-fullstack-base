import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRoleEnum } from '../enums/user-role.enum';
import { UserStatusEnum } from '../enums/user-status.enum';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRoleEnum)
  @IsOptional()
  role?: number;

  @IsEnum(UserStatusEnum)
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
