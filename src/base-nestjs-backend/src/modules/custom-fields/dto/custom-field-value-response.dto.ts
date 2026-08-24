import { CustomFieldTypeEnum } from '../enums/custom-field-type.enum';

export class CustomFieldValueResponseDto {
  key: string;
  label: string;
  fieldType: CustomFieldTypeEnum;
  value: any;
}
