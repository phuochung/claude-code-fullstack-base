import {
  ThrottlerBehindProxyGuard,
  CLIENT_IP_HEADER,
} from './throttler-behind-proxy.guard';

/**
 * What the rate limiter counts. Every case here is a way an attacker could
 * otherwise choose their own bucket key — and one of them (the spoofed header
 * with no credentials) is what the previous `req.ips[0]` implementation
 * returned, which silently defeated the 10/min limit on the auth routes.
 */
describe('ThrottlerBehindProxyGuard.getTracker', () => {
  const WEBSITE_TOKEN = 'website-token-value';
  const BUYER_IP = '203.0.113.7';
  const RESOLVED_IP = '198.51.100.1';

  let guard: ThrottlerBehindProxyGuard;
  let originalToken: string | undefined;

  // getTracker is protected; the storage/reflector deps it never touches are
  // stubbed so the guard can be exercised without a Nest testing module.
  const track = (req: Record<string, unknown>): Promise<string> =>
    (
      guard as unknown as {
        getTracker(r: Record<string, unknown>): Promise<string>;
      }
    ).getTracker(req);

  const request = (headers: Record<string, string> = {}) => ({
    headers,
    ip: RESOLVED_IP,
    // Present so a regression back to reading X-Forwarded-For directly fails
    // here: the leftmost entry is caller-supplied and must never be the tracker.
    ips: ['1.1.1.1', RESOLVED_IP],
  });

  const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

  beforeEach(() => {
    originalToken = process.env.WEBSITE_AUTH_TOKEN;
    process.env.WEBSITE_AUTH_TOKEN = WEBSITE_TOKEN;
    guard = new ThrottlerBehindProxyGuard(
      {} as never,
      {} as never,
      { getAllAndOverride: () => undefined } as never,
    );
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.WEBSITE_AUTH_TOKEN;
    else process.env.WEBSITE_AUTH_TOKEN = originalToken;
  });

  it('uses the address Express resolved through trust proxy', async () => {
    await expect(track(request())).resolves.toBe(RESOLVED_IP);
  });

  it('ignores X-Client-IP from an unauthenticated caller', async () => {
    // The whole point: a browser can send this header, so it must buy nothing.
    await expect(
      track(request({ [CLIENT_IP_HEADER]: BUYER_IP })),
    ).resolves.toBe(RESOLVED_IP);
  });

  it('ignores X-Client-IP when the bearer token is wrong', async () => {
    await expect(
      track(
        request({ [CLIENT_IP_HEADER]: BUYER_IP, ...bearer('not-the-token') }),
      ),
    ).resolves.toBe(RESOLVED_IP);
  });

  it('ignores a token of the right length but wrong content', async () => {
    // Guards the constant-time compare against a length-only check.
    const sameLength = 'X'.repeat(WEBSITE_TOKEN.length);
    await expect(
      track(request({ [CLIENT_IP_HEADER]: BUYER_IP, ...bearer(sameLength) })),
    ).resolves.toBe(RESOLVED_IP);
  });

  it('ignores a non-Bearer scheme', async () => {
    await expect(
      track(
        request({
          [CLIENT_IP_HEADER]: BUYER_IP,
          authorization: `Basic ${WEBSITE_TOKEN}`,
        }),
      ),
    ).resolves.toBe(RESOLVED_IP);
  });

  it('honours X-Client-IP from the storefront proxy', async () => {
    await expect(
      track(
        request({ [CLIENT_IP_HEADER]: BUYER_IP, ...bearer(WEBSITE_TOKEN) }),
      ),
    ).resolves.toBe(BUYER_IP);
  });

  it('falls back to req.ip when the storefront sends an empty header', async () => {
    await expect(
      track(request({ [CLIENT_IP_HEADER]: '', ...bearer(WEBSITE_TOKEN) })),
    ).resolves.toBe(RESOLVED_IP);
  });

  it('ignores X-Client-IP when no website token is configured', async () => {
    delete process.env.WEBSITE_AUTH_TOKEN;
    await expect(
      track(
        request({ [CLIENT_IP_HEADER]: BUYER_IP, ...bearer(WEBSITE_TOKEN) }),
      ),
    ).resolves.toBe(RESOLVED_IP);
  });
});
