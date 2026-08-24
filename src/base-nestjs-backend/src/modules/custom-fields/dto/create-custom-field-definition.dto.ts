import {
  IsString, IsNotEmpty, IsEnum, IsOptional,
  IsBoolean, IsNumber, IsArray, MaxLength,
} from 'class-validator';
import { CustomFieldTypeEnum } from '../enums/custom-field-type.enum';

export class CreateCustomFieldDefinitionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  module: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @IsEnum(CustomFieldTypeEnum)
  fieldType: CustomFieldTypeEnum;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
