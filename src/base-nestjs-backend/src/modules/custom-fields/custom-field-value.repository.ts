import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PaginateModel } from 'mongoose';
import { BaseRepository } from '../../shared/base/base.repository';
import { BaseSchemaClass } from '../../shared/base/base.schema';
import { CustomFieldValue } from './schemas/custom-field-value.schema';

@Injectable()
export class CustomFieldValueRepository extends BaseRepository<
  CustomFieldValue & BaseSchemaClass
> {
  constructor(
    @InjectModel(CustomFieldValue.name)
    private readonly _model: Model<CustomFieldValue & BaseSchemaClass> &
      PaginateModel<CustomFieldValue & BaseSchemaClass>,
  ) {
    super(_model);
  }

  async findAllWithPopulate(
    filter: FilterQuery<CustomFieldValue & BaseSchemaClass>,
  ): Promise<(CustomFieldValue & BaseSchemaClass)[]> {
    return this._model.find(filter).populate('fieldDefinitionId').exec();
  }
}
