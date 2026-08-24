import { Controller, Post, UseGuards } from '@nestjs/common';
import { KeyAuthInternalGuard } from 'src/modules/auth/guards/key-auth.internal.guard';
import { StorageInternalService } from '../services/storage.internal.service';
import { CleanupResponseDto } from '../dto/cleanup-response.dto';

@UseGuards(KeyAuthInternalGuard)
@Controller('internal/storage')
export class StorageInternalController {
  constructor(
    private readonly storageInternalService: StorageInternalService,
  ) {}

  @Post('cleanup')
  async cleanup(): Promise<CleanupResponseDto> {
    return this.storageInternalService.cleanupOrphanedFiles();
  }
}
