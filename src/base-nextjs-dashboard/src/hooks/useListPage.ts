"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { PaginationResponse, TABLE_PARAMS } from "@/constants/common";
import { useAsyncAction } from "@/hooks/useAsyncAction";

export interface ListPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface BaseListFilters {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    keyword?: string;
}

/**
 * Read the base list params (page/limit/sortBy/sortOrder/keyword) from the URL.
 * Pages spread this into their own filter object and add page-specific params.
 */
export function readBaseListFilters(
    searchParams: ReadonlyURLSearchParams,
): BaseListFilters & { sortOrder: 'asc' | 'desc' } {
    const sortOrderParam = searchParams.get("sortOrder");
    return {
        page: Number(searchParams.get("page")) || Number(TABLE_PARAMS.DEFAULT_PAGE),
        limit: Number(TABLE_PARAMS.DEFAULT_LIMIT),
        sortBy: searchParams.get("sortBy") || TABLE_PARAMS.SORT_BY,
        sortOrder: (sortOrderParam === "asc" || sortOrderParam === "desc") ? sortOrderParam : TABLE_PARAMS.SORT_ORDER,
        keyword: searchParams.get("keyword") || "",
    };
}

/**
 * Params that drive the table itself rather than narrowing the result set.
 * Never counted as an active filter, and preserved by `clearFilters` — an admin
 * clearing filters expects the sort order and page size to stay put.
 */
const TABLE_PARAM_KEYS: readonly string[] = ["page", "limit", "sortBy", "sortOrder"];

/** A filter is "active" when the user actually put a value in it. */
function isFilterActive(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/**
 * How many filter conditions are narrowing the list right now — what the badge
 * on the show/hide-filters button shows. One per *param*, so a multi-select with
 * three values is 1 while a from/to date range is 2 (it is two conditions).
 */
export function countActiveFilters(
    filters: object,
    nonFilterKeys: readonly string[] = [],
): number {
    return Object.entries(filters).filter(
        ([key, value]) =>
            !TABLE_PARAM_KEYS.includes(key) &&
            !nonFilterKeys.includes(key) &&
            isFilterActive(value),
    ).length;
}

/**
 * Append the base list params to a URLSearchParams being built for the URL.
 * Pages append their page-specific params after this.
 */
export function appendBaseListParams(urlParams: URLSearchParams, filters: BaseListFilters): void {
    if (filters.keyword) urlParams.set("keyword", filters.keyword);
    if (filters.sortBy) urlParams.set("sortBy", filters.sortBy);
    if (filters.sortOrder) urlParams.set("sortOrder", filters.sortOrder);
    if (filters.page && filters.page > 1) urlParams.set("page", String(filters.page));
}

interface UseListPageOptions<TItem, TFilters extends BaseListFilters> {
    /** Read the initial filters from the URL (called once on mount). */
    getFiltersFromURL: (searchParams: ReadonlyURLSearchParams) => TFilters;
    /** Serialize the current filters into the URL query string. */
    serializeFilters: (filters: TFilters) => URLSearchParams;
    /** Fetch one page of results. */
    fetcher: (filters: TFilters) => Promise<PaginationResponse<TItem>>;
    /** Toast message when the fetch fails. */
    fetchErrorMessage: string;
    /** Reset to page 1 whenever a non-pagination filter changes. */
    resetPageOnFilterChange?: boolean;
    /**
     * Page-specific params that are *not* user filters — excluded from
     * `activeFilterCount` and preserved by `clearFilters`. Used by the tags page,
     * whose `module` is a section selector (always set) rather than a filter.
     *
     * Typed as plain strings on purpose: constraining it to `keyof TFilters`
     * turns this into an inference site and collapses TFilters to
     * `BaseListFilters` on any page that passes a key.
     */
    nonFilterKeys?: readonly string[];
}

/**
 * Shared state machine for the admin list pages:
 * URL sync + fetch + pagination + delete-and-refetch, with a stale-response
 * guard so a slow older response can never overwrite newer results.
 */
export function useListPage<TItem, TFilters extends BaseListFilters>({
    getFiltersFromURL,
    serializeFilters,
    fetcher,
    fetchErrorMessage,
    resetPageOnFilterChange = false,
    nonFilterKeys = [],
}: UseListPageOptions<TItem, TFilters>) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading, execute } = useAsyncAction();

    const [items, setItems] = useState<TItem[]>([]);
    const [pagination, setPagination] = useState<ListPagination>({
        total: 0,
        page: Number(TABLE_PARAMS.DEFAULT_PAGE),
        limit: Number(TABLE_PARAMS.DEFAULT_LIMIT),
        totalPages: 0,
    });
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<TFilters>(() => getFiltersFromURL(searchParams));

    // Latest values accessible from the stable callbacks below. Synced in an
    // effect (never during render): nothing reads these refs during render, and
    // this effect is declared before the fetch effect so both see the values of
    // the same commit.
    const filtersRef = useRef(filters);
    const fetcherRef = useRef(fetcher);
    const serializeRef = useRef(serializeFilters);
    const errorMessageRef = useRef(fetchErrorMessage);
    const nonFilterKeysRef = useRef(nonFilterKeys);
    useEffect(() => {
        filtersRef.current = filters;
        fetcherRef.current = fetcher;
        serializeRef.current = serializeFilters;
        errorMessageRef.current = fetchErrorMessage;
        nonFilterKeysRef.current = nonFilterKeys;
    });

    // Stale-response guard: only the most recently issued request may apply.
    const requestIdRef = useRef(0);

    const fetchList = useCallback(async (params: TFilters) => {
        const requestId = ++requestIdRef.current;
        await execute(
            () => fetcherRef.current(params),
            {
                showSuccessToast: false,
                errorMessage: errorMessageRef.current,
                onSuccess: (response) => {
                    if (requestId !== requestIdRef.current) return;
                    setItems(response.docs);
                    setPagination({
                        total: response.totalDocs,
                        page: response.page,
                        limit: response.limit,
                        totalPages: response.totalPages,
                    });
                },
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchList(filters);
    }, [fetchList, filters]);

    const handleFilterChange = useCallback((newFilters: Partial<TFilters>) => {
        const updatedFilters = { ...filtersRef.current, ...newFilters };
        if (resetPageOnFilterChange && !newFilters.page) {
            (updatedFilters as BaseListFilters).page = 1;
        }
        setFilters(updatedFilters);
        router.push(`?${serializeRef.current(updatedFilters).toString()}`, { scroll: false });
    }, [router, resetPageOnFilterChange]);

    /**
     * Drop every active filter in one go, keeping the table params (sort, page
     * size) and any `nonFilterKeys` — an admin clearing filters is not asking to
     * re-sort the table.
     *
     * Deleting the keys rather than blanking them is what makes this generic:
     * every page's `serializeFilters` already skips undefined params, so the
     * filters leave the URL without this hook knowing the page's filter shape.
     */
    const clearFilters = useCallback(() => {
        const cleared = { ...filtersRef.current } as Record<string, unknown>;
        for (const key of Object.keys(cleared)) {
            if (TABLE_PARAM_KEYS.includes(key) || nonFilterKeysRef.current.includes(key)) continue;
            delete cleared[key];
        }
        cleared.page = 1;
        const next = cleared as TFilters;
        setFilters(next);
        router.push(`?${serializeRef.current(next).toString()}`, { scroll: false });
    }, [router]);

    const refetch = useCallback(() => fetchList(filtersRef.current), [fetchList]);

    /** Run a delete (or similar) action, then refetch the current page. */
    const runAction = useCallback(async (action: () => Promise<unknown>, successMessage: string) => {
        await execute(action, {
            successMessage,
            onSuccess: () => fetchList(filtersRef.current),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchList]);

    return {
        items,
        pagination,
        filters,
        isLoading,
        showFilters,
        setShowFilters,
        activeFilterCount: countActiveFilters(filters, nonFilterKeys),
        clearFilters,
        handleFilterChange,
        refetch,
        runAction,
        execute,
    };
}
