import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { GcsService } from '../services/gcs.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadQueryDto } from '../dto/upload-query.dto';
import { JwtAuthAdminGuard } from 'src/modules/auth/guards/jwt-auth.admin.guard';
import { FileMetadataRepository } from '../file-metadata.repository';
import { Types } from 'mongoose';
import { STORAGE } from 'src/shared/constants/constant';

// Only image types the storefront/dashboard actually render. Without this the
// upload accepts anything under the size limit, and gcs.service.ts stores the
// client-supplied mimetype as the object's contentType — so an uploaded
// .html/.svg becomes executable markup served from the bucket origin.
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

@UseGuards(JwtAuthAdminGuard)
@Controller('admin/storage')
export class StorageAdminController {
  constructor(
    private readonly storageService: GcsService,
    private readonly fileMetadataRepository: FileMetadataRepository,
  ) {}

  @Post('image/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: STORAGE.FILE_LIMIT_SIZE,
      },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
          return callback(
            new UnsupportedMediaTypeException(
              'admin.storage.invalid_file_type',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadQueryDto,
    @Request() req: { user: { userId: Types.ObjectId } },
  ) {
    if (!file) {
      throw new BadRequestException('admin.storage.file_not_found');
    }

    const uploadResult = await this.storageService.uploadFile(
      file,
      query?.path || 'untitled',
    );

    try {
      const fileMetadata = await this.fileMetadataRepository.create({
        url: uploadResult.url,
        fileName: uploadResult.name,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        subPath: uploadResult.subPath,
        createdBy: req.user.userId,
      });

      return fileMetadata;
    } catch (error) {
      // Rollback: delete file from GCS if metadata save fails
      await this.storageService.deleteFile(uploadResult.subPath);
      throw error;
    }
  }
}
