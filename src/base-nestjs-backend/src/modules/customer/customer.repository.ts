import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { BaseRepository } from '../../shared/base/base.repository';
import { BaseSchemaClass } from '../../shared/base/base.schema';
import { Customer } from './schemas/customer.schema';

@Injectable()
export class CustomerRepository extends BaseRepository<
  Customer & BaseSchemaClass
> {
  constructor(
    @InjectModel(Customer.name)
    private readonly _model: Model<Customer & BaseSchemaClass> &
      PaginateModel<Customer & BaseSchemaClass>,
  ) {
    super(_model);
  }
}
