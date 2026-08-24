import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { TagModuleEnum } from '../enums/tag-module.enum';

export class CreateTagDto {
  @IsNotEmpty()
  @IsEnum(TagModuleEnum)
  module: TagModuleEnum;

  @IsNotEmpty()
  @IsString()
  nameEn: string;

  @IsNotEmpty()
  @IsString()
  nameVi: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionVi?: string;
}
