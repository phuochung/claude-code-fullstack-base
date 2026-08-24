import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ErrorReportService } from './error-report.service';
import { ReportErrorDto } from './dto/report-error.dto';
import { KeyAuthClientGuard } from '../auth/guards/key-auth.client.guard';
import { THROTTLER_CONFIGS } from '../../shared/constants/throttler.constant';

/**
 * Where a public storefront's errors enter the alert pipeline.
 *
 * Lives in `DevModule` alongside `/api/dev/*` because both are operator
 * plumbing rather than shop features — but it is a **separate controller**, not
 * another route on `DevController`: this one is authenticated by the website
 * token (`KeyAuthClientGuard`), whereas everything on `DevController` sits
 * behind the ops secret (`DevSecretGuard`). One controller cannot carry two
 * path prefixes or two guard regimes, and merging them would mean loosening one
 * of the two.
 *
 * The storefront never calls this from a browser — it posts to its own
 * same-origin `/api/report-error`, which attaches the token server-side.
 */
@UseGuards(KeyAuthClientGuard)
@Controller('client/errors')
export class ErrorReportClientController {
  constructor(private readonly errorReportService: ErrorReportService) {}

  /**
   * Throttled per **customer**, not per storefront instance: the proxy forwards
   * the buyer's address in `X-Client-IP`, which `ThrottlerBehindProxyGuard`
   * honours for a caller holding the website token. Keyed on the `default`
   * throttler name like every other override, and with its own limits so a
   * burst of error reports can never consume another endpoint's budget.
   *
   * This is only the first of three brakes — `ErrorReportService` de-duplicates
   * by fingerprint and the flood gate caps total Slack volume, which is what
   * actually defends against a botnet spreading load across addresses.
   */
  @Throttle({
    [THROTTLER_CONFIGS.DEFAULT.NAME]: {
      ttl: THROTTLER_CONFIGS.ERROR_REPORT.TTL,
      limit: THROTTLER_CONFIGS.ERROR_REPORT.LIMIT,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  report(@Body() dto: ReportErrorDto): void {
    // Empty body, always the same response. The caller must not be able to tell
    // whether a report was alerted, de-duplicated or flood-dropped — that would
    // make this endpoint an oracle for tuning an attack against it.
    this.errorReportService.report(dto.source, dto);
  }
}
