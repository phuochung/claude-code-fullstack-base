import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { ErrorReportClientController } from './error-report.client.controller';
import { ErrorReportAdminController } from './error-report.admin.controller';
import { ErrorReportService } from './error-report.service';
import { ErrorReportFloodGate } from './error-report-flood-gate';
import { SharedModule } from '../../shared/shared.module';
import { StorageModule } from '../storage/storage.module';

/**
 * Operator plumbing: the deploy checklist, the deliberate-error trigger, and
 * the error-report intake for browser-facing surfaces.
 *
 * The three controllers are authenticated three different ways — ops secret
 * (`DevController`), website token (`ErrorReportClientController`), admin JWT
 * (`ErrorReportAdminController`) — which is why they are separate classes
 * rather than routes on one. They share a single `ErrorReportService`, so the
 * dedupe window and the flood gate are global across every surface instead of
 * one budget each.
 */
@Module({
  imports: [SharedModule, StorageModule],
  controllers: [
    DevController,
    ErrorReportClientController,
    ErrorReportAdminController,
  ],
  providers: [DevService, ErrorReportService, ErrorReportFloodGate],
  exports: [ErrorReportService],
})
export class DevModule {}
