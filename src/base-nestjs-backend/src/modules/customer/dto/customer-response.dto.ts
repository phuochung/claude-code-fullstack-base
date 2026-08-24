import { Expose, Transform } from 'class-transformer';
import { CustomerGenderEnum } from '../enums/customer-gender.enum';
import { CustomerSourceEnum } from '../enums/customer-source.enum';
import { CustomFieldValueResponseDto } from '../../custom-fields/dto/custom-field-value-response.dto';

export class CustomerResponseDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  name: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  email?: string;

  @Expose()
  gender?: CustomerGenderEnum;

  @Expose()
  source?: CustomerSourceEnum;

  @Expose()
  address?: string;

  @Expose()
  customFields?: CustomFieldValueResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
