import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../shared/base/base.repository';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { BaseSchemaClass } from '../../shared/base/base.schema';

@Injectable()
export class UserRepository extends BaseRepository<User & BaseSchemaClass> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User & BaseSchemaClass> &
      PaginateModel<User & BaseSchemaClass>,
  ) {
    super(userModel);
  }
}
