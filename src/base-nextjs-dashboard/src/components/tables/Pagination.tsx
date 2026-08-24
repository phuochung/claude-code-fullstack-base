"use client";

import type { FC, ReactNode } from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  previousLabel?: ReactNode;
  nextLabel?: ReactNode;

  // Existing: affects controls wrapper
  className?: string;

  // Existing override (still supported)
  summary?: ReactNode;

  // New: built-in common summary (use in all tables)
  showSummary?: boolean;
  totalItems?: number;
  pageSize?: number;
  t?: (key: string) => string;
  summaryClassName?: string;

  containerClassName?: string;
};

const getWindowPages = (
  currentPage: number,
  totalPages: number,
  windowSize = 3
) => {
  if (totalPages <= 0) return [];
  const size = Math.min(windowSize, totalPages);
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - size + 1));
  const end = Math.min(totalPages, start + size - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
  className = "",
  summary,
  showSummary = true,
  totalItems,
  pageSize,
  t,
  summaryClassName = "text-sm text-gray-700 dark:text-gray-300",
  containerClassName = "",
}) => {
  const pagesAroundCurrent = getWindowPages(currentPage, totalPages, 3);

  const goTo = (page: number) => {
    if (totalPages <= 0) return;
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    onPageChange(page);
  };

  const start = pagesAroundCurrent[0] ?? 1;
  const end = pagesAroundCurrent[pagesAroundCurrent.length - 1] ?? 1;

  const showFirst = totalPages > 0 && start > 1;
  const showLeadingEllipsis = start > 2;
  const showTrailingEllipsis = end < totalPages - 1;
  const showLast = totalPages > 0 && end < totalPages;

  const controls = (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className="mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm"
      >
        {previousLabel}
      </button>

      <div className="flex items-center gap-2">
        {showFirst && (
          <button
            onClick={() => goTo(1)}
            className={`px-4 py-2 rounded ${currentPage === 1
              ? "bg-brand-500 text-white"
              : "text-gray-700 dark:text-gray-400"
              } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
          >
            1
          </button>
        )}

        {showLeadingEllipsis && <span className="px-2">...</span>}

        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => goTo(page)}
            className={`px-4 py-2 rounded ${currentPage === page
              ? "bg-brand-500 text-white"
              : "text-gray-700 dark:text-gray-400"
              } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
          >
            {page}
          </button>
        ))}

        {showTrailingEllipsis && <span className="px-2">...</span>}

        {showLast && (
          <button
            onClick={() => goTo(totalPages)}
            className={`px-4 py-2 rounded ${currentPage === totalPages
              ? "bg-brand-500 text-white"
              : "text-gray-700 dark:text-gray-400"
              } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
          >
            {totalPages}
          </button>
        )}
      </div>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        {nextLabel}
      </button>
    </div>
  );

  const canRenderDefaultSummary =
    !!showSummary &&
    typeof totalItems === "number" &&
    typeof pageSize === "number" &&
    typeof t === "function";

  const defaultSummary = canRenderDefaultSummary ? (
    <div className={summaryClassName}>
      {t("common.pagination.showing")} {(currentPage - 1) * pageSize + 1} -{" "}
      {Math.min(currentPage * pageSize, totalItems)} {t("common.pagination.of")} {totalItems}
    </div>
  ) : null;

  const summaryNode = summary ?? defaultSummary;

  if (summaryNode) {
    return (
      <div className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${containerClassName}`.trim()}>
        {summaryNode}
        {controls}
      </div>
    );
  }

  return controls;
};

export default Pagination;
