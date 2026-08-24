import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Rejects anything that is not `application/json` with a 415.
 *
 * **This is a CSRF control, not a tidiness rule.** It exists for cookie-
 * authenticated write endpoints: a malicious page the owner visits could make
 * their browser POST to the API with the admin JWT cookie attached. That was
 * acute while the cookie was `sameSite: 'none'`; R02 flipped it to `'lax'`
 * (2026-08-17), which restores the browser's own CSRF protection — this guard
 * is now the second layer rather than the only one.
 *
 * The only cross-site POST that reaches a handler *without* a CORS preflight is
 * an HTML form, and a form can send exactly three content types —
 * `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`.
 * None of them is JSON, so requiring JSON kills that vector outright. A
 * cross-site `fetch` with `Content-Type: application/json` *does* trigger a
 * preflight, which the explicit `CORS_ORIGIN` list already refuses.
 *
 * Kept deliberately now that the cookie is `'lax'`: it costs nothing and the
 * protection stops depending on one cookie attribute being right.
 *
 * Deliberately not global — `postForm` uploads are `multipart/form-data` and
 * must keep working. Apply it per controller.
 */
@Injectable()
export class JsonOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const contentType = request.headers['content-type'] ?? '';

    // Compare the media type only: a real request may carry parameters
    // (`application/json; charset=utf-8`).
    const mediaType = contentType.split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') {
      throw new UnsupportedMediaTypeException(
        'common_error.unsupported_media_type',
      );
    }

    return true;
  }
}
