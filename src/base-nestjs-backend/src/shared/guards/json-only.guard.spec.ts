import {
  ExecutionContext,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { JsonOnlyGuard } from './json-only.guard';

describe('JsonOnlyGuard', () => {
  const guard = new JsonOnlyGuard();

  const contextWith = (contentType?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: contentType ? { 'content-type': contentType } : {},
        }),
      }),
    }) as unknown as ExecutionContext;

  it('accepts application/json', () => {
    expect(guard.canActivate(contextWith('application/json'))).toBe(true);
  });

  it('accepts a charset parameter', () => {
    // Browsers routinely append one; comparing the raw header would 415 real
    // requests.
    expect(
      guard.canActivate(contextWith('application/json; charset=utf-8')),
    ).toBe(true);
    expect(guard.canActivate(contextWith('Application/JSON'))).toBe(true);
  });

  describe('the CSRF vector it exists to close', () => {
    // An HTML form is the only cross-site POST that reaches a handler without a
    // CORS preflight, and a form can send exactly these three content types.
    // Since R02 the admin JWT cookie is sameSite:'lax', so the browser already
    // blocks this; the guard stays as defence in depth.
    it.each([
      'application/x-www-form-urlencoded',
      'multipart/form-data; boundary=----x',
      'text/plain',
    ])('rejects %s', (contentType) => {
      expect(() => guard.canActivate(contextWith(contentType))).toThrow(
        UnsupportedMediaTypeException,
      );
    });
  });

  it('rejects a missing content type', () => {
    expect(() => guard.canActivate(contextWith())).toThrow(
      UnsupportedMediaTypeException,
    );
  });

  it('rejects a look-alike media type', () => {
    expect(() =>
      guard.canActivate(contextWith('application/json-patch+json')),
    ).toThrow(UnsupportedMediaTypeException);
    expect(() =>
      guard.canActivate(contextWith('text/application/json')),
    ).toThrow(UnsupportedMediaTypeException);
  });
});
