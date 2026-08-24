import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetCustomFieldValueDto {
  @IsString()
  @IsNotEmpty()
  definitionId: string;

  @IsOptional()
  value: any;
}
