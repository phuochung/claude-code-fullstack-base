import { Expose, Transform, Type } from 'class-transformer';

export class BlogCategoryDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  nameVi: string;

  @Expose()
  nameEn: string;
}

export class BlogTagDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  nameVi: string;

  @Expose()
  nameEn: string;
}

export class BlogFileMetadataDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  url?: string;
}

export class BlogSectionDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  order: number;

  @Expose()
  type: string;

  @Expose()
  content?: string;

  @Expose()
  @Type(() => BlogFileMetadataDto)
  fileMetadata?: BlogFileMetadataDto;

  @Expose()
  caption?: string;
}

export class BlogUserDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}

export class BlogResponseDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  slug: string;

  @Expose()
  title: string;

  @Expose()
  excerpt: string;

  @Expose()
  language: string;

  @Expose()
  status: number;

  @Expose()
  publishedAt: Date;

  @Expose()
  @Type(() => BlogCategoryDto)
  category: BlogCategoryDto;

  @Expose()
  @Type(() => BlogTagDto)
  tags: BlogTagDto[];

  @Expose()
  @Type(() => BlogFileMetadataDto)
  bannerFileMetadata?: BlogFileMetadataDto;

  @Expose()
  @Type(() => BlogSectionDto)
  sections: BlogSectionDto[];

  @Expose()
  viewCount: number;

  @Expose()
  @Type(() => BlogUserDto)
  user: BlogUserDto;

  @Expose()
  tmpHideAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  publishBy?: string;

  @Expose()
  tmpHideBy?: string;
}
