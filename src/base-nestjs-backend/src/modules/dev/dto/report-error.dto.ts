import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  ErrorReportSourceEnum,
  WEBSITE_ERROR_SOURCES,
} from '../enums/error-report.enum';

/**
 * One error caught on a browser-facing surface.
 *
 * The second of two validation layers — the storefront's `/api/report-error`
 * checks the same shape first (see `lib/error-reporting.ts`). This layer exists
 * because anything holding `WEBSITE_AUTH_TOKEN` can post here directly, so the
 * storefront's checks cannot be assumed to have run.
 *
 * The global `ValidationPipe` runs `forbidNonWhitelisted`, which makes this
 * class an **allow-list**: a payload carrying any field not declared below is
 * rejected outright. That is what stops a future reporter from smuggling
 * cookies, headers or request bodies into Slack by adding a field on its side.
 *
 * Rationale: see "Error alerting" in the backend CLAUDE.md.
 *
 * `source` is deliberately **not** on this base class: it is the one field a
 * caller must not be free to choose. Each surface's DTO below constrains it to
 * the values its own guard vouches for, and the dashboard's omits it entirely
 * because that route has a single producer.
 */
export class ErrorReportFieldsDto {
  @IsString()
  @Length(1, 400)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  stack?: string;

  /**
   * Next.js's error digest — the stable hash shown to the customer as "Error code"
   * on both error pages, and the field that ties their Zalo message to this
   * alert. Pattern-checked rather than merely length-checked: it is a token, so
   * anything with punctuation or markup in it is not a digest.
   */
  @IsOptional()
  @Matches(/^[\w-]{1,64}$/)
  digest?: string;

  /**
   * **Pathname only — never a full URL and never a query string.**
   *
   * A URL like `/lookup?code=…&phone=…` carries personal data, so every
   * producer strips the query at source and this rule is the enforcement. The
   * leading-slash match is what makes "no query" checkable: an absolute URL
   * (`https://…?phone=…`) fails it outright.
   */
  @IsString()
  @MaxLength(200)
  @Matches(/^\/[^?#]*$/, {
    message: 'path must be a query-less pathname beginning with /',
  })
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  userAgent?: string;

  /** Server reports only: the matched route *pattern*, e.g. `/product/[slug]`. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  route?: string;

  /** Server reports only: which render pass threw (RSC vs SSR). */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  renderSource?: string;

  /** Server reports only: the HTTP method of the failing request. */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  method?: string;

  // No timestamp field: the client's clock is not trusted, and the service
  // stamps `receivedAt` itself.
}

/**
 * The storefront's report (`POST /client/errors`).
 *
 * `source` stays in the body here because the website has **two** producers
 * behind one endpoint — `onRequestError` on the server and the browser reporter
 * — and the alert is far more useful when it says which. The proxy overwrites it
 * with `website-client` for anything arriving from a page, so a browser cannot
 * claim the server's trust; this `@IsIn` is the backstop for a caller that
 * bypasses the proxy with the website token.
 */
export class ReportErrorDto extends ErrorReportFieldsDto {
  // Spread rather than cast: `as unknown as string[]` silenced the type error
  // by erasing the check, so a value that is not in the enum would have been
  // accepted here without complaint.
  @IsIn([...WEBSITE_ERROR_SOURCES])
  source: ErrorReportSourceEnum;
}

/**
 * The admin dashboard's report (`POST /admin/errors`).
 *
 * **No `source` field at all.** The dashboard has one producer, so the value is
 * a property of the route rather than of the payload — the controller supplies
 * it. With `forbidNonWhitelisted` this also means a dashboard report that tried
 * to send `source: 'website-server'` is rejected outright rather than quietly
 * mislabelled.
 */
export class ReportAdminErrorDto extends ErrorReportFieldsDto {}
