import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSearchKeyword } from "./useSearchKeyword";

/**
 * Pins the contract documented in `useSearchKeyword.ts`: the box is local
 * while the admin types, follows the *committed* keyword when it changes
 * upstream, and is keyed on the committed value alone — a neighbouring
 * filter changing must never revert a keyword being typed.
 */
describe("useSearchKeyword", () => {
    it("starts from the committed keyword", () => {
        const { result } = renderHook(() => useSearchKeyword("draft"));
        expect(result.current[0]).toBe("draft");
    });

    it("starts empty when nothing is committed", () => {
        const { result } = renderHook(() => useSearchKeyword(undefined));
        expect(result.current[0]).toBe("");
    });

    it("keeps typing local — the committed value is only read, never written", () => {
        const { result } = renderHook(() => useSearchKeyword(""));
        act(() => result.current[1]("dra"));
        expect(result.current[0]).toBe("dra");
    });

    it("follows the committed keyword back down when it changes upstream", () => {
        // Clear Filters, a deep link, and browser back all land here: the
        // committed keyword changes without the admin touching the box.
        const { result, rerender } = renderHook(
            ({ committed }: { committed: string }) => useSearchKeyword(committed),
            { initialProps: { committed: "stale term" } },
        );
        rerender({ committed: "" });
        expect(result.current[0]).toBe("");
    });

    it("does not clobber half-typed input on an unrelated re-render", () => {
        // A neighbouring filter changing re-renders the page with the *same*
        // committed keyword; the effect is keyed on that value alone, so the
        // in-progress keyword must survive.
        const { result, rerender } = renderHook(
            ({ committed }: { committed: string }) => useSearchKeyword(committed),
            { initialProps: { committed: "" } },
        );
        act(() => result.current[1]("halfway"));
        rerender({ committed: "" });
        expect(result.current[0]).toBe("halfway");
    });
});
