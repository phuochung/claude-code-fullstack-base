/**
 * Throttler (Rate Limiting) Configurations
 *
 * Only DEFAULT is registered globally. STRICT and CLIENT are used as
 * per-route overrides via @Throttle() decorator — they are NOT registered
 * as separate named throttlers to avoid all contexts applying to every route.
 */
export const THROTTLER_CONFIGS = {
  /**
   * DEFAULT - Registered globally, applied to all routes automatically
   * Covers admin/dashboard endpoints (authenticated users)
   */
  DEFAULT: {
    NAME: 'default',
    TTL: 60000, // 1 minute in milliseconds
    LIMIT: 500, // 500 requests per minute per IP
  },

  /**
   * STRICT - Override values for sensitive authentication endpoints
   * Brute-force protection for: login, signup, forgot-password, reset-password
   */
  STRICT: {
    TTL: 60000, // 1 minute
    LIMIT: 10, // 10 requests per minute per IP
  },

  /**
   * CLIENT - Override values for client/website APIs (SSR + browser)
   * Higher limit because Next.js SSR makes multiple parallel requests
   * from the same server IP on each page load
   */
  CLIENT: {
    TTL: 60000, // 1 minute
    LIMIT: 200, // 200 requests per minute per IP
  },

  /**
   * ERROR_REPORT - Override values for a browser-facing surface reporting a
   * caught error (`POST /client/errors`).
   *
   * 10 per minute per end-user address. A well-behaved client caps itself far
   * below this; the limit is the backstop for one that ignores its own cap.
   *
   * A per-IP limit is the weakest of three brakes — it does nothing against a
   * botnet sending one report per address. The fingerprint dedupe and the flood
   * gate in ErrorReportService are what actually bound Slack volume.
   */
  ERROR_REPORT: {
    TTL: 60000, // 1 minute
    LIMIT: 10, // 10 requests per minute per IP
  },

  /**
   * ERROR_REPORT_ADMIN - Override values for the dashboard reporting a caught
   * error (`POST /admin/errors`).
   *
   * Looser than the public surface because the caller is an authenticated
   * admin: the limit exists to bound a crash loop that outruns the client's own
   * session cap, not to fend off the public.
   */
  ERROR_REPORT_ADMIN: {
    TTL: 60000, // 1 minute
    LIMIT: 20, // 20 requests per minute per IP
  },
} as const;

// Export individual constants for convenience
export const { DEFAULT, STRICT, CLIENT } = THROTTLER_CONFIGS;
