import { reportAdminError } from "@/lib/report-admin-error";

/**
 * Catches everything that happens *outside* React's render pass — which, on a
 * panel this client-heavy, is most of it: event handlers, async effects,
 * rejected promises from API calls.
 *
 * The two `app/*error.tsx` boundaries only see render crashes. Without this
 * file, a failed save in an `onClick` never reaches Slack.
 *
 * Next runs this on the client before hydration (Next >= 15.3).
 */

if (typeof window !== "undefined") {
	window.addEventListener("error", (event: ErrorEvent) => {
		reportAdminError({
			error: event.error ?? event.message,
			renderSource: "window.error",
		});
	});

	window.addEventListener(
		"unhandledrejection",
		(event: PromiseRejectionEvent) => {
			reportAdminError({
				error: event.reason,
				renderSource: "window.unhandledrejection",
			});
		},
	);
}
