import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ErrorReportService } from './error-report.service';
import { ReportAdminErrorDto } from './dto/report-error.dto';
import { ErrorReportSourceEnum } from './enums/error-report.enum';
import { JwtAuthAdminGuard } from '../auth/guards/jwt-auth.admin.guard';
import { JsonOnlyGuard } from '../../shared/guards/json-only.guard';
import { THROTTLER_CONFIGS } from '../../shared/constants/throttler.constant';

/**
 * Where the admin dashboard's errors enter the alert pipeline.
 *
 * Same service, dedupe window and flood gate as the storefront's
 * `client/errors` — only the transport differs. The dashboard bakes every env
 * var at build time and holds no server-side secret, so it cannot copy the
 * website's token-proxy pattern; instead the browser posts here directly with
 * the admin JWT cookie it already sends on every other admin call
 * (`credentials: 'include'`).
 *
 * **Accepted gap: pre-login crashes are not reported.** A signin-page crash has
 * no cookie and gets a 401 here. That is deliberate — an unauthenticated report
 * endpoint on a public URL is a spam surface, and "the owner cannot log in" is
 * the one failure reported instantly by phone anyway. Do not add an
 * unauthenticated variant without a real incident to justify it.
 */
@UseGuards(JwtAuthAdminGuard, JsonOnlyGuard)
@Controller('admin/errors')
export class ErrorReportAdminController {
  constructor(private readonly errorReportService: ErrorReportService) {}

  /**
   * 20/min per address — one admin, so generous is fine; this only exists to
   * bound a crash loop that outruns the dashboard's own session cap. Keyed on
   * the `default` throttler name like every other override, with its own bucket
   * so a burst of error reports cannot lock the owner out of the admin API.
   */
  @Throttle({
    [THROTTLER_CONFIGS.DEFAULT.NAME]: {
      ttl: THROTTLER_CONFIGS.ERROR_REPORT_ADMIN.TTL,
      limit: THROTTLER_CONFIGS.ERROR_REPORT_ADMIN.LIMIT,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  report(@Body() dto: ReportAdminErrorDto, @Req() request: Request): void {
    // The user agent is read from the request, never the payload — same rule as
    // the storefront's proxy. A page that is already misbehaving should not get
    // to shape the diagnostics about it.
    const header = request.headers['user-agent'];
    const userAgent =
      typeof header === 'string' ? header.slice(0, 200) : undefined;

    // The source is the route's, not the payload's — `ReportAdminErrorDto` has
    // no `source` field at all, so a dashboard report cannot label itself as the
    // website's.
    //
    // Nothing about *which* admin reported it is passed on: the JWT is the
    // credential, never content. With one admin the identity adds nothing an
    // alert can act on, and it would put a real person's email in a Slack
    // channel shared with another project.
    this.errorReportService.report(ErrorReportSourceEnum.DASHBOARD, {
      ...dto,
      ...(userAgent ? { userAgent } : {}),
    });
  }
}
