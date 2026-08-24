import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { CategoryModuleEnum } from '../enums/category-module.enum';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsEnum(CategoryModuleEnum)
  module: CategoryModuleEnum;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameVi: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsString()
  @IsOptional()
  descriptionVi?: string;
}
