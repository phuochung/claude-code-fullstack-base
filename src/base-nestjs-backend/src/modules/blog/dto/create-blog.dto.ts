import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlogStatusEnum } from '../enums/blog-status.enum';

export class BlogSectionDto {
  @IsNotEmpty()
  order: number;

  @IsEnum(['html', 'image'])
  type: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  fileMetadata?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateBlogDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  excerpt: string;

  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en'])
  language?: string;

  @IsOptional()
  @IsString()
  bannerFileMetadata?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogSectionDto)
  // @ArrayMaxSize(10)
  sections: BlogSectionDto[];

  @IsString()
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(BlogStatusEnum)
  status?: number;
}
