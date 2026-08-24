/**
 * Auth Constants
 * Shared between middleware, the /api/auth route and client code.
 */

// Must match the backend's COMMON_CONSTANTS.COOKIE_NAME. Rename both together
// per product — two products sharing a parent domain with the same cookie name
// will overwrite each other's sessions.
export const AUTH_COOKIE_NAME = 'auth_token';

// Keep in sync with the backend JWT expiry (30 days).
export const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // seconds

// Minimum password length enforced by every password form.
export const MIN_PASSWORD_LENGTH = 6;
