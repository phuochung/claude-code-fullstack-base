import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { Blog } from './schemas/blog.schema';
import { BaseRepository } from '../../shared/base/base.repository';
import { BaseSchemaClass } from 'src/shared/base/base.schema';

@Injectable()
export class BlogRepository extends BaseRepository<Blog & BaseSchemaClass> {
  constructor(
    @InjectModel(Blog.name)
    private readonly _model: Model<Blog & BaseSchemaClass> &
      PaginateModel<Blog & BaseSchemaClass>,
  ) {
    super(_model);
  }

  // You can add custom methods here if needed
  // The paginate method is inherited from BaseRepository
}
