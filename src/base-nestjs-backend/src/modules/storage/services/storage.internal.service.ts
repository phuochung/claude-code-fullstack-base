import { Injectable } from '@nestjs/common';
import { FileMetadataRepository } from '../file-metadata.repository';
import { GcsService } from './gcs.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CleanupResponseDto } from '../dto/cleanup-response.dto';

@Injectable()
export class StorageInternalService {
  private readonly CLEANUP_BATCH_LIMIT = 100;
  private readonly DAYS_OLD_THRESHOLD = 7;

  constructor(
    private readonly fileMetadataRepository: FileMetadataRepository,
    private readonly gcsService: GcsService,
    private readonly loggerService: LoggerService,
  ) {}

  async cleanupOrphanedFiles(): Promise<CleanupResponseDto> {
    try {
      // Calculate date threshold (7 days ago)
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - this.DAYS_OLD_THRESHOLD);

      // Find orphaned files (blog is null and older than 7 days)
      const orphanedFiles = await this.fileMetadataRepository.findAll(
        {
          blog: null,
          createdAt: { $lt: dateThreshold },
        },
        {
          limit: this.CLEANUP_BATCH_LIMIT,
          lean: true,
        },
      );

      if (orphanedFiles.length === 0) {
        return {
          deletedCount: 0,
          message: 'No orphaned files to cleanup',
        };
      }

      let deletedCount = 0;

      // Process each file
      for (const file of orphanedFiles) {
        try {
          // Delete from GCS twice to ensure deletion
          const subPath = file.subPath;

          // First deletion attempt
          try {
            await this.gcsService.deleteFile(subPath);
          } catch (firstError: any) {
            // Check if it's a "file not found" error - if so, continue
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (firstError?.code !== 404 && firstError?.code !== 'NOT_FOUND') {
              const errorId = `cleanup-gcs-error-${Date.now()}`;
              this.loggerService.error(
                {
                  errorId,
                  message: 'Failed to delete file from GCS (first attempt)',
                  subPath,
                  fileId: file._id.toString(),
                  error: firstError,
                },
                errorId,
              );
              // Stop the entire operation on critical error
              throw new Error(
                `Failed to delete file from GCS: ${subPath}. ErrorId: ${errorId}`,
              );
            }
          }

          // Delete file metadata permanently from database
          await this.fileMetadataRepository.deleteByIdPermanently(
            file._id.toString(),
          );

          deletedCount++;
        } catch (fileError) {
          // Log and stop on any error
          const errorId = `cleanup-file-error-${Date.now()}`;
          this.loggerService.error(
            {
              errorId,
              message: 'Failed to cleanup file',
              fileId: file._id.toString(),
              subPath: file.subPath,
              error: fileError,
            },
            errorId,
          );
          // Stop the entire operation
          throw fileError;
        }
      }

      return {
        deletedCount,
        message: `Successfully deleted ${deletedCount} orphaned file(s)`,
      };
    } catch (error) {
      // Send detailed error to Slack
      const errorId = `cleanup-operation-error-${Date.now()}`;
      this.loggerService.error(
        {
          errorId,
          message: 'Storage cleanup operation failed',
          error,
        },
        errorId,
      );
      throw error;
    }
  }
}
