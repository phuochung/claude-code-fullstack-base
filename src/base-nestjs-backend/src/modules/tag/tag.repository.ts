import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../shared/base/base.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { BaseSchemaClass } from '../../shared/base/base.schema';
import { Tag } from './schemas/tag.schema';

@Injectable()
export class TagRepository extends BaseRepository<Tag & BaseSchemaClass> {
  constructor(
    @InjectModel(Tag.name)
    private readonly _model: Model<Tag & BaseSchemaClass> &
      PaginateModel<Tag & BaseSchemaClass>,
  ) {
    super(_model);
  }
}
