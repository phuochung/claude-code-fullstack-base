import {
  ClientSession,
  Model,
  Document,
  QueryOptions,
  FilterQuery,
  UpdateQuery,
  PaginateResult,
  PaginateOptions as MongoosePaginateOptions,
  PaginateModel,
  PopulateOptions,
} from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  populate?: string | string[] | PopulateOptions[];
  select?: string | object;
  lean?: boolean;
}

export class BaseRepository<T> {
  constructor(private readonly model: Model<T> & PaginateModel<T>) {}

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const createdDocument = new this.model(data);
    await createdDocument.save({ session });
    return createdDocument;
  }

  async findById(_id: string): Promise<T | null> {
    return this.model.findById(_id).exec();
  }

  async findOne(
    filter: FilterQuery<T & Document>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findOne(filter, null, options).exec();
  }

  findAll(
    filter: FilterQuery<T & Document>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    return this.model.find(filter, null, options).exec();
  }

  async paginate(
    filter: FilterQuery<T & Document>,
    options: PaginationOptions = {},
  ): Promise<PaginateResult<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      populate,
      select,
      lean = false,
    } = options;

    const mongooseOptions: MongoosePaginateOptions = {
      page,
      limit,
      sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
      lean,
    };

    if (populate) {
      mongooseOptions.populate = populate;
    }

    if (select) {
      mongooseOptions.select = select;
    }

    return this.model.paginate(filter, mongooseOptions);
  }

  async count(filter: FilterQuery<T & Document>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async updateById(
    _id: string,
    updateData: UpdateQuery<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(_id, updateData, { new: true, session })
      .exec();
  }

  async deleteById(_id: string, session?: ClientSession): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        _id,
        { deleted: true, deletedAt: new Date() },
        { new: true, session },
      )
      .exec();
  }

  async deleteByIdPermanently(
    _id: string,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model.findByIdAndDelete(_id, { session }).exec();
  }
}
