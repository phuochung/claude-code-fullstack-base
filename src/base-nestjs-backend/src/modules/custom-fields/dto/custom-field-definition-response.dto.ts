import { Expose, Transform } from 'class-transformer';
import { CustomFieldTypeEnum } from '../enums/custom-field-type.enum';

export class CustomFieldDefinitionResponseDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  module: string;

  @Expose()
  key: string;

  @Expose()
  label: string;

  @Expose()
  fieldType: CustomFieldTypeEnum;

  @Expose()
  options: string[];

  @Expose()
  required: boolean;

  @Expose()
  order: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
