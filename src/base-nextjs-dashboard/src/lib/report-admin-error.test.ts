import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "@/api/base";

/**
 * These tests pin the three deliberate behaviours documented in
 * `report-admin-error.ts` — the bare-fetch transport, the allow-list payload,
 * and truncation landing *at* each cap — plus the extension-stack and dedupe
 * guards. The module keeps dedupe state at module level, so each test
 * re-imports a fresh copy.
 */

type ReportFn = typeof import("./report-admin-error").reportAdminError;

let reportAdminError: ReportFn;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
    vi.resetModules();
    ({ reportAdminError } = await import("./report-admin-error"));
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function sentPayload(call = 0): Record<string, string> {
    expect(fetchMock.mock.calls.length).toBeGreaterThan(call);
    const init = fetchMock.mock.calls[call][1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, string>;
}

function errorWithStack(message: string, frames: string[]): Error {
    const err = new Error(message);
    err.stack = [`Error: ${message}`, ...frames].join("\n");
    return err;
}

describe("reportAdminError", () => {
    it("POSTs to /admin/errors with cookie credentials and a JSON content type", () => {
        reportAdminError({ error: new Error("boom") });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`${API_BASE_URL}/admin/errors`);
        expect(init.method).toBe("POST");
        expect(init.credentials).toBe("include");
        expect(init.headers).toEqual({ "Content-Type": "application/json" });
        expect(init.keepalive).toBe(true);
    });

    it("sends only fields the backend DTO declares — never userAgent or source", () => {
        reportAdminError({
            error: new Error("boom"),
            renderSource: "window",
            route: "/blogs/[id]",
        });

        expect(Object.keys(sentPayload()).sort()).toEqual([
            "message",
            "path",
            "renderSource",
            "route",
            "stack",
        ]);
    });

    it("truncates every capped field to land exactly at its cap, ellipsis included", () => {
        const err = new Error("m".repeat(1000));
        err.stack = "Error\n" + "    at frame (app.js:1:1)\n".repeat(400);

        reportAdminError({
            error: err,
            renderSource: "r".repeat(80),
            route: "/x".repeat(300),
        });

        const payload = sentPayload();
        expect(payload.message).toHaveLength(400);
        expect(payload.message.endsWith("…")).toBe(true);
        expect(payload.stack).toHaveLength(4000);
        expect(payload.route).toHaveLength(200);
        expect(payload.renderSource).toHaveLength(50);
    });

    it("keeps values already at or under a cap untouched", () => {
        reportAdminError({ error: new Error("short message") });
        expect(sentPayload().message).toBe("short message");
    });

    it("floors a blank message so the backend's @Length(1, 400) cannot reject it", () => {
        reportAdminError({ error: new Error("   ") });
        expect(sentPayload().message).toBe("Unknown dashboard error");
    });

    it("drops an error whose every stack frame belongs to a browser extension", () => {
        const err = errorWithStack("extension noise", [
            "    at inject (chrome-extension://abcdefg/content.js:10:5)",
            "    at run (moz-extension://hijklmn/overlay.js:2:1)",
        ]);
        reportAdminError({ error: err });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("still reports a real error that merely passed through an extension frame", () => {
        const err = errorWithStack("real bug", [
            "    at inject (chrome-extension://abcdefg/content.js:10:5)",
            "    at render (webpack-internal:///./src/app/page.tsx:5:3)",
        ]);
        reportAdminError({ error: err });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("treats a frameless stack as reportable, not as extension noise", () => {
        const err = new Error("no frames");
        err.stack = "Error: no frames";
        reportAdminError({ error: err });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("dedupes an identical crash loop inside the client-side window", () => {
        reportAdminError({ error: new Error("loop"), renderSource: "window" });
        reportAdminError({ error: new Error("loop"), renderSource: "window" });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not dedupe distinct errors", () => {
        reportAdminError({ error: new Error("first") });
        reportAdminError({ error: new Error("second") });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("forwards only a digest matching the DTO's token pattern", () => {
        const ok = new Error("with digest") as Error & { digest?: string };
        ok.digest = "abc-DEF_123";
        reportAdminError({ error: ok });
        expect(sentPayload().digest).toBe("abc-DEF_123");

        const bad = new Error("bad digest") as Error & { digest?: string };
        bad.digest = "not a token!";
        reportAdminError({ error: bad });
        expect(sentPayload(1).digest).toBeUndefined();
    });

    it("sends the pathname only, never the query string", () => {
        window.history.pushState({}, "", "/blogs?token=secret");
        reportAdminError({ error: new Error("path check") });
        expect(sentPayload().path).toBe("/blogs");
        window.history.pushState({}, "", "/");
    });

    it("omits the stack key for a non-Error value", () => {
        reportAdminError({ error: "plain string failure" });
        const payload = sentPayload();
        expect(payload.message).toBe("plain string failure");
        expect("stack" in payload).toBe(false);
    });

    it("never throws, even when fetch itself blows up synchronously", () => {
        fetchMock.mockImplementation(() => {
            throw new Error("network stack gone");
        });
        expect(() =>
            reportAdminError({ error: new Error("crash while crashing") }),
        ).not.toThrow();
    });
});
