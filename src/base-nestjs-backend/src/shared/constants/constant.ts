// Admin session lifetime. The JWT expiry and the dashboard cookie maxAge are
// both derived from this single value so they can never drift apart.
const AUTH_SESSION_DAYS = 30;

export const COMMON_CONSTANTS = {
  // Rename this per product before deploying. Two products sharing a parent
  // domain with the same cookie name will overwrite each other's sessions, and
  // the dashboard's AUTH_COOKIE_NAME must be changed to match.
  COOKIE_NAME: 'auth_token',
  ITEMS_PER_PAGE: 20,
  SALT_ROUND: 10,
  // Fallback language for API messages when the request doesn't specify one
  // (via ?lang=, Accept-Language, or x-lang). Overridable per deployment with
  // the FALLBACK_LANGUAGE env var — see i18n.config.ts. Translations live in
  // src/i18n/<lang>/.
  LANG: 'en',
  // Locale and timezone for log timestamps. Named here rather than hardcoded in
  // LoggerService so a downstream product can move both in one place. Neutral
  // defaults: set these to wherever your team reads logs. Changing LOCALE
  // changes the timestamp *format*, so move both together if anything parses
  // the logs.
  LOCALE: 'en-US',
  TIMEZONE: 'UTC',
  CHAR_TO_JOIN_ARRAY: ';:;',
  CHAR_BREAK_LINE: '\n',
};

// Dev-only fallback so local dev works without extra setup. Never used in
// production: getJwtSecret() fails fast at startup when JWT_SECRET is unset.
const JWT_DEV_FALLBACK_SECRET = 'local-dev-only-insecure-jwt-secret';

/**
 * JWT signing secret, read from the JWT_SECRET env var.
 *
 * Call this lazily (inside a useFactory / constructor, not at module
 * top-level) so the env file loaded by ConfigModule is already in
 * process.env.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be set in production',
    );
  }
  return JWT_DEV_FALLBACK_SECRET;
}

export const JWT_CONSTANTS = {
  EXPIRE: `${AUTH_SESSION_DAYS}d`,
  COOKIE_MAX_AGE_MS: AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000,
};

export const STORAGE = {
  FILE_LIMIT_SIZE: 10 * 1024 * 1024, // 10MB
};
