/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ThrottlerException } from '@nestjs/throttler';
import { LoggerService } from '../services/logger.service';

const REDACTED = '[REDACTED]';

/**
 * Headers never worth recording. `cookie` carries the admin JWT, so without
 * this a single 500 puts a working session token in the log sink — and
 * `LoggerService.error` forwards that payload to Slack.
 */
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie'];

/**
 * Body fields replaced before the payload is logged or sent to Slack.
 *
 * Two groups with different reasons. Credentials (`password` … `token`) must
 * never be recorded anywhere. The rest is personal data: a 500 on a customer
 * write puts the entire request body in this payload, so `name` /
 * `phoneNumber` / `address` / `email` are redacted even though they are
 * ordinary business fields — the log sink is a much wider audience than the
 * database. The record id is what actually identifies a row for debugging, and
 * that is deliberately not redacted.
 *
 * Matched by key at every depth, so nested DTOs are covered. Both `phone` and
 * `phoneNumber` are listed: this repo uses the latter, downstream products use
 * either.
 */
const SENSITIVE_BODY_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'accessToken',
  'token',
  'name',
  'phone',
  'phoneNumber',
  'address',
  'email',
  // Free text a user types; routinely contains a phone number or an address.
  'note',
];

function redactHeaders(headers: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...(headers as Record<string, unknown>),
  };
  for (const header of SENSITIVE_HEADERS) {
    if (header in result) {
      result[header] = REDACTED;
    }
  }
  return result;
}

function redactBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }
  if (Array.isArray(body)) {
    return body.map((item) => redactBody(item));
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    result[key] = SENSITIVE_BODY_FIELDS.includes(key)
      ? REDACTED
      : redactBody(value);
  }
  return result;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private i18n: I18nService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly loggerService: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let isAttentionNeeded = false;
    // Handle specific exception types with translated messages
    let message: string;
    // Field-level details (e.g. class-validator messages) - forwarded so 400s
    // are actionable instead of an opaque translated string.
    let errors: string[] | undefined;

    if (exception instanceof ThrottlerException) {
      // Rate limit exceeded - use translated message
      message = this.i18n.t('common_error.too_many_requests');

      // **Deliberately NOT a Slack alert.** A 429 is the rate limiter doing its
      // job, and alerting on it turns the defence into the attack: every
      // request a bot makes *past* the limit would post to the channel, so
      // tripping the brake produces far more noise than evading it. Measured in
      // tnt-backend: 60 requests against a 10/min limit sent 51 Slack messages.
      // It also fires organically when real users share a CGNAT address.
      //
      // The record is kept where it belongs: stdout -> Cloud Logging, greppable
      // and groupable, with no fan-out to a channel. Path only, never the query
      // string, which can carry personal data.
      this.loggerService.warn(
        `[throttled] ${request.method} ${String(request.path ?? request.url ?? '').split('?')[0]}`,
      );
    } else if (httpStatus === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      // Internal server error
      message = this.i18n.t('common_error.an_error_occurred');
      isAttentionNeeded = true;
    } else {
      // Other HTTP exceptions - translate the exception message key
      const httpException = exception as HttpException;
      const response = httpException.getResponse?.();
      const responseObject =
        response && typeof response === 'object'
          ? (response as { message?: unknown; args?: unknown })
          : undefined;

      // A caller that reports a count throws
      // `new BadRequestException({ message: '<key>', args: { count } })`;
      // forward the args so the placeholder in the translation resolves.
      // `args` stays server-side - the response body is rebuilt below.
      const args =
        responseObject?.args && typeof responseObject.args === 'object'
          ? (responseObject.args as Record<string, unknown>)
          : undefined;

      message = this.i18n.t(
        httpException.message || 'common_error.an_error_occurred',
        args ? { args } : undefined,
      );

      // class-validator (ValidationPipe) puts the per-field messages on the
      // response object as `message: string[]` - surface them.
      if (Array.isArray(responseObject?.message)) {
        errors = responseObject.message.map((item) => String(item));
      }
    }

    // Send error message to Slack channel
    if (isAttentionNeeded) {
      const errorId = Date.now().toString();
      const errorMessage =
        exception instanceof Error ? exception.message : String(exception);
      const stackTrace =
        exception instanceof Error ? exception.stack : undefined;

      // Redact credentials and personal data before anything reaches the
      // console or Slack.
      this.loggerService.error(
        {
          message: JSON.stringify(errorMessage),
          stack: stackTrace,
          url: request.originalUrl || request.url,
          method: request.method,
          body: redactBody(request.body),
          query: request.query,
          params: request.params,
          headers: redactHeaders(request.headers),
        },
        errorId,
      );
    }

    const responseBody: Record<string, unknown> = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      message,
    };
    if (errors?.length) {
      responseBody.errors = errors;
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
