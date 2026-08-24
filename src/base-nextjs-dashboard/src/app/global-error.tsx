"use client";

import { useEffect } from "react";
import { reportAdminError } from "@/lib/report-admin-error";

/**
 * Root-layout error boundary — the last line of defence.
 *
 * This replaces the whole document, so it must render its own `<html>` and
 * `<body>`. Two consequences follow, and both are why this file looks unlike
 * every other component here:
 *
 * - **Inline styles, no Tailwind classes.** The layout that failed is what loads
 *   the stylesheet, so class names may resolve to nothing.
 * - **No providers.** `ThemeProvider` and `I18nProvider` live in that same
 *   failed layout, so there is no theme and no `t()`. The copy is hardcoded
 *   English and the colours are literals.
 *
 * The root layout stacks five providers, so a crash in it is not hypothetical.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		reportAdminError({ error, renderSource: "app/global-error.tsx" });
	}, [error]);

	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "1.5rem",
					backgroundColor: "#ffffff",
					color: "#1d2939",
					fontFamily: '"Times New Roman", Times, serif',
					textAlign: "center",
				}}
			>
				<div style={{ maxWidth: "28rem" }}>
					<h1
						style={{
							margin: "0 0 0.5rem",
							fontSize: "1.5rem",
							fontWeight: 600,
						}}
					>
						The dashboard failed to load
					</h1>
					<p
						style={{
							margin: "0 0 1.5rem",
							fontSize: "0.875rem",
							color: "#667085",
							lineHeight: 1.6,
						}}
					>
						Something went wrong while starting the app. The error has been
						reported. Reloading usually clears it.
					</p>

					{error.digest && (
						<p
							style={{
								margin: "0 0 1.5rem",
								fontSize: "0.75rem",
								fontFamily: "monospace",
								color: "#98a2b3",
							}}
						>
							Error code: {error.digest}
						</p>
					)}

					<button
						onClick={reset}
						style={{
							appearance: "none",
							border: "none",
							cursor: "pointer",
							borderRadius: "0.5rem",
							backgroundColor: "#465fff",
							color: "#ffffff",
							padding: "0.75rem 1.25rem",
							fontSize: "0.875rem",
							fontWeight: 500,
							fontFamily: "inherit",
						}}
					>
						Reload
					</button>
				</div>
			</body>
		</html>
	);
}
