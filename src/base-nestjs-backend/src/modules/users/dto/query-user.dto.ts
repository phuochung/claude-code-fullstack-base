import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CommonPaginateDto } from '../../../shared/dto/common-paginate.dto';
import { UserRoleEnum } from '../enums/user-role.enum';

export class QueryUserDto extends CommonPaginateDto {
  // Roles are stored as numbers — transform the query string so the filter
  // can actually match (a raw string never equals a numeric role).
  @IsOptional()
  @Type(() => Number)
  @IsEnum(UserRoleEnum)
  role?: number;
}
