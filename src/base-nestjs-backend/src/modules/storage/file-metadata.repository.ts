import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel } from 'mongoose';
import { BaseRepository } from '../../shared/base/base.repository';
import { BaseSchemaClass } from '../../shared/base/base.schema';
import { FileMetadata } from './schemas/file-metadata.schema';

@Injectable()
export class FileMetadataRepository extends BaseRepository<
  FileMetadata & BaseSchemaClass
> {
  constructor(
    @InjectModel(FileMetadata.name)
    private readonly _model: Model<FileMetadata & BaseSchemaClass> &
      PaginateModel<FileMetadata & BaseSchemaClass>,
  ) {
    super(_model);
  }
}
