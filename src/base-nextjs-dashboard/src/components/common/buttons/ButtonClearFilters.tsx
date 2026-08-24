"use client";

import { useI18n } from "@/context/I18nContext";

type ButtonClearFiltersProps = {
    onClick: () => void;
    /** Active filter conditions — the button renders nothing at 0. */
    count: number;
    className?: string;
};

/**
 * Resets every filter on a list table, search keyword included.
 *
 * Lives in the page header next to the show/hide-filters toggle rather than
 * inside the filter panel, so it stays reachable while the panel is collapsed —
 * which is exactly the state where a forgotten filter goes unnoticed. It renders
 * only when something is actually filtered, so an unfiltered header is unchanged.
 */
export default function ButtonClearFilters({ onClick, count, className = "" }: ButtonClearFiltersProps) {
    const { t } = useI18n();

    if (count <= 0) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-error-500 ${className}`}
        >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t("common.button.clearFilters")}
        </button>
    );
}
