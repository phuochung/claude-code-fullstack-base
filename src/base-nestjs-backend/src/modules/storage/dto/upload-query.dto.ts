import { IsOptional, IsString } from 'class-validator';

export class UploadQueryDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  maxSize?: string;
}
