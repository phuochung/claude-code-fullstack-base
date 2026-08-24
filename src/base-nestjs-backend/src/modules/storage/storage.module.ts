import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GcsService } from './services/gcs.service';
import { FileMetadataRepository } from './file-metadata.repository';
import { StorageAdminController } from './controllers/storage.admin.controller';
import { StorageInternalController } from './controllers/storage.internal.controller';
import { StorageInternalService } from './services/storage.internal.service';
import {
  FileMetadata,
  FileMetadataSchema,
} from './schemas/file-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileMetadata.name, schema: FileMetadataSchema },
    ]),
  ],
  controllers: [StorageAdminController, StorageInternalController],
  providers: [GcsService, FileMetadataRepository, StorageInternalService],
  exports: [GcsService, FileMetadataRepository],
})
export class StorageModule {}
