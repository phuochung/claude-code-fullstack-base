import { API_BASE_URL } from "@/api/base";

/**
 * Ships an uncaught dashboard error to `POST /api/admin/errors`, which feeds the
 * backend's Slack alert pipeline (dedupe → flood gate → escaped alert).
 *
 * Three things here are deliberate and easy to undo by accident:
 *
 * 1. **It does not go through `apiClient`.** That wrapper's 401 handler
 *    *redirects to `/signin`*, so an expired session would throw the admin off
 *    the page they were on because reporting a crash failed. This uses a bare
 *    `fetch` with `credentials: 'include'`.
 * 2. **The payload is an allow-list.** The backend DTO sets
 *    `forbidNonWhitelisted`, so one undeclared field makes the whole report a
 *    400. `userAgent` is read from the request header server-side and must not
 *    be sent; the admin DTO has no `source` field at all.
 * 3. **Truncation lands at or below each cap, never one over.** The backend
 *    rejects at exactly the limit, so slicing to `max` and *then* appending an
 *    ellipsis produces `max + 1` and 400s the report — silently dropping
 *    precisely the reports worth having (the long stacks).
 *
 * **Accepted gap: pre-login crashes are not reported.** The endpoint requires
 * the admin JWT cookie, so a signin-page crash gets a 401 and is swallowed here.
 * That matches the backend's own reasoning — an unauthenticated report endpoint
 * on a public URL is a spam surface.
 */

/** Mirrors the backend DTO's validators. Values are inclusive maximums. */
const LIMITS = {
	message: 400,
	stack: 4000,
	path: 200,
	route: 200,
	renderSource: 50,
	method: 10,
} as const;

/** Truncate so the *result* is at most `max` chars — the ellipsis counts. */
function cap(value: string, max: number): string {
	return value.length <= max ? value : value.slice(0, max - 1) + "…";
}

/**
 * True only when *every* stack frame belongs to a browser extension.
 *
 * Provenance, not message matching: an extension's exceptions surface as the
 * page's own uncaught errors and would otherwise page Slack for something no
 * user can act on and no deploy can fix. Requiring every frame means a real
 * application error that merely passed through an extension still reports.
 */
function isExtensionStack(stack: string | undefined): boolean {
	if (!stack) return false;
	const frames = stack
		.split("\n")
		.slice(1)
		.map((line) => line.trim())
		.filter(Boolean);
	if (frames.length === 0) return false;
	return frames.every((frame) =>
		/(chrome|moz|safari-web)-extension:\/\//.test(frame),
	);
}

// Bounds a crash loop that re-renders and re-throws faster than the backend's
// own dedupe window can see. Cheap client-side guard, not a substitute for it.
const DEDUPE_WINDOW_MS = 10_000;
let lastFingerprint = "";
let lastSentAt = 0;

export interface AdminErrorReport {
	error: unknown;
	/** Which boundary caught it — `error.tsx`, `global-error.tsx`, `window`. */
	renderSource?: string;
	/** The matched route pattern, when the caller knows it. */
	route?: string;
}

export function reportAdminError({
	error,
	renderSource,
	route,
}: AdminErrorReport): void {
	if (typeof window === "undefined") return;

	try {
		const err = error instanceof Error ? error : undefined;
		const rawMessage =
			err?.message ?? (typeof error === "string" ? error : String(error));
		const stack = err?.stack;

		if (isExtensionStack(stack)) return;

		// `message` is @Length(1, 400) — an empty string is a 400, so it needs a
		// floor as well as a ceiling.
		const message = cap(rawMessage.trim() || "Unknown dashboard error", LIMITS.message);

		const fingerprint = `${message}|${renderSource ?? ""}`;
		const now = Date.now();
		if (fingerprint === lastFingerprint && now - lastSentAt < DEDUPE_WINDOW_MS) {
			return;
		}
		lastFingerprint = fingerprint;
		lastSentAt = now;

		// Pathname only. The DTO's @Matches rejects a query string outright, and
		// that is the point: a query can carry data that must not reach Slack.
		const path = cap(window.location.pathname || "/", LIMITS.path);

		// Next attaches a `digest` to server-side errors; it is the hash the user
		// sees, and what ties a report to this alert. Only send it if it matches
		// the DTO's token pattern.
		const rawDigest = (error as { digest?: unknown })?.digest;
		const digest =
			typeof rawDigest === "string" && /^[\w-]{1,64}$/.test(rawDigest)
				? rawDigest
				: undefined;

		const payload: Record<string, string> = { message, path };
		if (stack) payload.stack = cap(stack, LIMITS.stack);
		if (digest) payload.digest = digest;
		if (route) payload.route = cap(route, LIMITS.route);
		if (renderSource) payload.renderSource = cap(renderSource, LIMITS.renderSource);

		void fetch(`${API_BASE_URL}/admin/errors`, {
			method: "POST",
			// Required: the backend's JsonOnlyGuard answers 415 to anything else.
			headers: { "Content-Type": "application/json" },
			// Sends the admin JWT cookie the rest of the panel already relies on.
			credentials: "include",
			body: JSON.stringify(payload),
			// The page may be unloading or about to be replaced by a boundary.
			keepalive: true,
		}).catch(() => {
			// Reporting a crash must never itself throw or surface to the admin.
		});
	} catch {
		// Same: a failure to report is strictly less bad than a second error.
	}
}
