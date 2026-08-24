import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerGenderEnum } from '../enums/customer-gender.enum';
import { CustomerSourceEnum } from '../enums/customer-source.enum';
import { SetCustomFieldValueDto } from '../../custom-fields/dto/set-custom-field-value.dto';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber: string;

  @IsOptional()
  email?: string;

  @IsEnum(CustomerGenderEnum)
  @IsOptional()
  gender?: CustomerGenderEnum;

  @IsEnum(CustomerSourceEnum)
  @IsOptional()
  source?: CustomerSourceEnum;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetCustomFieldValueDto)
  @IsOptional()
  customFields?: SetCustomFieldValueDto[];
}
