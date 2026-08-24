import { IsString, IsNotEmpty } from 'class-validator';

export class QueryCustomFieldDefinitionDto {
  @IsString()
  @IsNotEmpty()
  module: string;
}
