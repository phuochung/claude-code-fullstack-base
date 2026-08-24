"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportAdminError } from "@/lib/report-admin-error";

/**
 * Segment-level error boundary: catches a render crash anywhere below the root
 * layout, keeps the shell alive, and reports it.
 *
 * The copy here is **hardcoded English, not `useI18n()`** — on purpose. The
 * provider lives in the root layout and loads messages asynchronously, so a
 * boundary that depended on it would render raw translation keys at exactly the
 * moment something is already wrong.
 */
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		reportAdminError({ error, renderSource: "app/error.tsx" });
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
				Something went wrong
			</h1>
			<p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
				This page failed to load. The error has been reported — you can try
				again, or head back to the dashboard.
			</p>

			{/* The digest is the only handle a person has on a specific occurrence:
			    it is what the alert carries, so showing it lets someone match what
			    they saw to what was logged. */}
			{error.digest && (
				<p className="mb-6 font-mono text-xs text-gray-400 dark:text-gray-500">
					Error code: {error.digest}
				</p>
			)}

			<div className="flex flex-wrap items-center justify-center gap-3">
				<button
					onClick={reset}
					className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
				>
					Try again
				</button>
				<Link
					href="/"
					className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Back to dashboard
				</Link>
			</div>
		</div>
	);
}
