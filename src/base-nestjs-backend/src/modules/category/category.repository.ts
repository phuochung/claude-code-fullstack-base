import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../shared/base/base.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { BaseSchemaClass } from '../../shared/base/base.schema';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoryRepository extends BaseRepository<
  Category & BaseSchemaClass
> {
  constructor(
    @InjectModel(Category.name)
    private readonly _model: Model<Category & BaseSchemaClass> &
      PaginateModel<Category & BaseSchemaClass>,
  ) {
    super(_model);
  }
}
