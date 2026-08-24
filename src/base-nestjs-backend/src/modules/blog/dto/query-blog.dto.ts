import { IsOptional, IsEnum, IsMongoId, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { BlogStatusEnum } from '../enums/blog-status.enum';

export class QueryBlogDto {
  @IsOptional()
  @IsEnum(BlogStatusEnum, { each: true })
  @Type(() => Number)
  statuses?: number[];

  @IsOptional()
  @IsMongoId({ each: true })
  categories?: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  lang?: string;
}
