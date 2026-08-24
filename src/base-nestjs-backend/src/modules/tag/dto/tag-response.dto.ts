import { Expose, Transform } from 'class-transformer';

export class TagResponseDto {
  @Expose()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  @Transform(({ obj }) => obj?._id?.toString() || obj._id)
  _id: string;

  @Expose()
  module: string;

  @Expose()
  nameVi: string;

  @Expose()
  nameEn: string;

  @Expose()
  descriptionVi?: string;

  @Expose()
  descriptionEn?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
