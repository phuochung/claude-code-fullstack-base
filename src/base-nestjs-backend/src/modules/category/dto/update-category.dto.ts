import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { CategoryModuleEnum } from '../enums/category-module.enum';

export class UpdateCategoryDto {
  @IsEnum(CategoryModuleEnum)
  @IsOptional()
  module?: CategoryModuleEnum;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nameVi?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsString()
  @IsOptional()
  descriptionVi?: string;
}
