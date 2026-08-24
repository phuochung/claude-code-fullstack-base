import { Controller, Get, UseGuards } from '@nestjs/common';
import { DevService, ChecklistResponse } from './dev.service';
import { DevSecretGuard } from './guards/dev-secret.guard';

@Controller('dev')
@UseGuards(DevSecretGuard)
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Get('checklist')
  async getChecklist(): Promise<ChecklistResponse> {
    return this.devService.runChecklist();
  }
}
