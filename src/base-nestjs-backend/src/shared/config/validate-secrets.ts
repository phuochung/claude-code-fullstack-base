/**
 * Startup guard against weak shared secrets.
 *
 * The static-key guards (KeyAuthGuard, DevSecretGuard) already fail closed when
 * their env var is unset — that surface simply refuses every request — so an
 * *absent* token is safe and is deliberately not treated as an error here. A
 * token that is present but guessable is the dangerous case: nothing rejects it
 * at request time, so it can only be caught at startup.
 *
 * This matters because the values shipped in this repo's history followed a
 * `<project>.<audience>@<year>` pattern (e.g. `base.internal@2026`). Anyone who
 * has read the public repo can enumerate that space in seconds.
 *
 * Enforced in production only, matching how CORS_ORIGIN and JWT_SECRET already
 * behave — local dev stays friction-free.
 */

/** Hex-encoded 128 bits. `openssl rand -hex 32` produces 64 chars. */
const MIN_SECRET_LENGTH = 32;

/**
 * Shapes that indicate a hand-typed secret rather than a generated one. These
 * catch the placeholder values in `.example-env` and the dated scheme above.
 */
const GUESSABLE_PATTERNS: readonly RegExp[] = [
  /^your-/i, // your-secret-key-here
  /secret-?key/i,
  /changeme|change-me/i,
  /password/i,
  /@20\d\d$/, // base.internal@2026
  /\.(internal|website|client|admin)@/i,
  /^(dev|test|local|staging|prod)[-_.]/i,
];

/**
 * Every env var used as a bearer/shared secret. DEV_API_SECRET_KEY is included
 * because DevModule is registered unconditionally in AppModule, so its guarded
 * endpoint is reachable in production too.
 */
const GUARDED_SECRETS: readonly string[] = [
  'JWT_SECRET',
  'WEBSITE_AUTH_TOKEN',
  'INTERNAL_AUTH_TOKEN',
  'DEV_API_SECRET_KEY',
];

/**
 * Throws if any configured secret is weak. Never includes a secret's value in
 * the thrown message — only its variable name — so the error is safe to log.
 */
export function validateSecretStrength(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const problems: string[] = [];

  for (const name of GUARDED_SECRETS) {
    const value = env[name];
    if (!value) {
      continue; // guards fail closed; absence disables the surface safely
    }
    if (value.length < MIN_SECRET_LENGTH) {
      problems.push(
        `${name} is ${value.length} characters; at least ${MIN_SECRET_LENGTH} are required`,
      );
    } else if (GUESSABLE_PATTERNS.some((pattern) => pattern.test(value))) {
      problems.push(`${name} looks hand-written rather than generated`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Refusing to start: weak shared secret(s).\n  - ${problems.join('\n  - ')}\n` +
        `Generate each with: openssl rand -hex 32`,
    );
  }
}
