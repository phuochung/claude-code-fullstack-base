import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { tokensMatch } from '../../modules/auth/guards/key-auth.guard';

/**
 * Header a storefront proxy uses to pass the end user's address through to the
 * backend. Deliberately **not** `X-Forwarded-For`: see the guard below.
 */
export const CLIENT_IP_HEADER = 'x-client-ip';

/**
 * Whether this request carries the website's shared secret.
 *
 * Read straight off the header rather than relying on `KeyAuthClientGuard`
 * having run: global `APP_GUARD`s execute **before** controller-scoped guards,
 * so at this point nothing has authenticated the request yet. Constant-time
 * compare for the same reason `KeyAuthGuard` uses one — this runs on every
 * request and would otherwise be a timing oracle on the token.
 */
/** The only parts of the request this guard reads. */
interface TrackedRequest {
  headers?: Record<string, unknown>;
  ip?: string;
}

function isTrustedProxyCaller(req: TrackedRequest): boolean {
  const expected = process.env.WEBSITE_AUTH_TOKEN;
  if (!expected) return false;
  const header = req.headers?.authorization;
  if (typeof header !== 'string') return false;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && !!token && tokensMatch(token, expected);
}

/**
 * Throttler guard for an app behind proxies.
 *
 * **The tracker must never be a value the caller controls.** This used to return
 * `req.ips[0]` — the *leftmost* `X-Forwarded-For` entry. Cloud Run *appends* the
 * address it actually observed, so the leftmost entry is whatever the client
 * typed: with `TRUST_PROXY=true` (trust every hop) any client could rotate a
 * fake header and mint itself unlimited quota, which silently defeated the
 * 10/min brute-force limit on the auth routes.
 *
 * `req.ip` is the right primitive: Express resolves it through `trust proxy`,
 * which — set to a **hop count** rather than `true` — yields the rightmost
 * address a client cannot forge. `TRUST_PROXY` must therefore be the number of
 * proxies in front of this service (1 for Cloud Run on its own). **Re-check that
 * number whenever the topology changes**: putting a load balancer in front of
 * the API makes it 2, and a stale value means the throttle quietly keys on the
 * load balancer instead of the caller.
 *
 * Hop counting cannot serve both callers at once, which is why the storefront
 * gets an explicit channel instead. A browser reaches this service through one
 * hop; a storefront's server-side proxy is a *second* hop, so the end user's
 * address sits one position further left and no single `trust proxy` number is
 * right for both. `X-Client-IP` closes that gap, honoured **only** for a caller holding
 * `WEBSITE_AUTH_TOKEN` — the trust boundary is the shared secret, not a
 * positional guess, and nothing unauthenticated can reach it.
 *
 * Without it every proxied request shares one bucket (the website's egress
 * address), so a single abuser hitting the limit locks out every real user of
 * the storefront at once.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * The base class declares `getTracker` as returning a Promise, so this
   * override must be `async` even though every branch is synchronous.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: TrackedRequest): Promise<string> {
    const forwarded = req.headers?.[CLIENT_IP_HEADER];
    if (
      typeof forwarded === 'string' &&
      forwarded &&
      isTrustedProxyCaller(req)
    ) {
      return forwarded;
    }
    return req.ip ?? '';
  }
}
