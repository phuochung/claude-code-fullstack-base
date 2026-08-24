import { TransformObjectId } from '../../../shared/decorators/transform-object-id.decorator';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @TransformObjectId()
  _id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  role: number;

  @Expose()
  status: number;

  @Expose()
  phoneNumber?: string;

  @Expose()
  lastActiveAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  createdBy?: string;
}
