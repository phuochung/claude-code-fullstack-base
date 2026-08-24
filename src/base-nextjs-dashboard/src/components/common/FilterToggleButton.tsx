"use client";

import { useI18n } from "@/context/I18nContext";

interface FilterToggleButtonProps {
    show: boolean;
    onToggle: () => void;
    /**
     * Active filter conditions. When > 0 the button carries a count badge and
     * keeps the "on" styling even while the panel is collapsed — otherwise a
     * filtered-to-empty table is indistinguishable from a table with no data.
     */
    count?: number;
}

export default function FilterToggleButton({ show, onToggle, count = 0 }: FilterToggleButtonProps) {
    const { t } = useI18n();
    const isFiltering = count > 0;

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={show}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                ${show || isFiltering
                    ? 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
        >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t(show ? "common.button.hideFilters" : "common.button.showFilters")}
            {isFiltering && (
                <span
                    title={t("common.button.activeFilters")}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white"
                >
                    {count}
                </span>
            )}
        </button>
    );
}
