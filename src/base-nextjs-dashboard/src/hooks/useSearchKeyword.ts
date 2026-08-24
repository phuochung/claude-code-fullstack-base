"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Search-box state for a list table.
 *
 * The box is local while the admin types and only reaches `useListPage` on
 * submit, so it also has to follow the *committed* keyword back down whenever
 * that changes upstream — clearing the filters, a deep link, browser back.
 * Without this the "Clear Filters" button would empty the results but leave the
 * stale search term sitting in the box.
 *
 * The effect is keyed on the committed value alone, never the whole filter
 * object: changing a neighbouring filter must not revert a keyword the admin is
 * halfway through typing.
 */
export function useSearchKeyword(
    committed: string | undefined,
): [string, Dispatch<SetStateAction<string>>] {
    const [keyword, setKeyword] = useState(committed || "");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate (see CLAUDE.md): follow the committed keyword back down; behavior pinned by useSearchKeyword.test.ts
        setKeyword(committed || "");
    }, [committed]);

    return [keyword, setKeyword];
}
