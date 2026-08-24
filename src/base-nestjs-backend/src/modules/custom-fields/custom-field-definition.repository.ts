import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { BaseRepository } from '../../shared/base/base.repository';
import { BaseSchemaClass } from '../../shared/base/base.schema';
import { CustomFieldDefinition } from './schemas/custom-field-definition.schema';

@Injectable()
export class CustomFieldDefinitionRepository extends BaseRepository<
  CustomFieldDefinition & BaseSchemaClass
> {
  constructor(
    @InjectModel(CustomFieldDefinition.name)
    private readonly _model: Model<CustomFieldDefinition & BaseSchemaClass> &
      PaginateModel<CustomFieldDefinition & BaseSchemaClass>,
  ) {
    super(_model);
  }
}
