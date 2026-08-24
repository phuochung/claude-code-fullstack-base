#!/usr/bin/env python3
"""Regenerate the self-hosted webfonts in src/fonts/ — and prove they render the
panel exactly the way Times New Roman does today.

WHY THIS EXISTS AT ALL (R34)
    The panel used to declare `font-family: 'Times New Roman', Times, serif` and
    ship no font bytes, so every device rendered it in whatever serif it happened
    to own. macOS has Times; Android substitutes a wider Noto/DejaVu serif and
    every text box grows. That is what broke the header at 360px in R30 finding 4
    — and, more importantly, it meant every layout measured on a Mac was measured
    against a font most of the shop's phones do not have.

WHY SELF-HOSTED AND NOT `next/font/google`
    `next/font/google` downloads the binaries from fonts.gstatic.com *during
    `next build`*, which makes Google Fonts a hard dependency of every prod
    deploy — and cloudbuild.yaml builds with `--no-cache`, so it re-fetches every
    time. On 2026-08-12 that took the *website* deploy down: Google served the
    build container CSS pointing at font files it had already purged, and
    `next build` failed on an unchanged commit. Same cloudbuild here, same trap.

WHY TINOS
    Tinos (Steve Matteson, OFL) is drawn as a metric-compatible substitute for
    Times New Roman, and it ships a `vietnamese` subset. Metric compatibility is
    the whole point: the panel's layout has been tuned against Times' exact
    advance widths, so anything that merely *looks* similar would reflow it.
    Henry's requirement (2026-08-13) was "same look" — this script is what turns
    that from a hope into a checked property.

WHEN TO RUN THIS
    Taking an upstream Tinos release, changing the subsets, or adding a style.
    Not on a schedule — a font that renders correctly has no reason to change,
    and every regeneration is a visual diff on every screen. Nothing here runs as
    part of `npm run build`.

        ./scripts/build-fonts.py            # rebuild src/fonts/ and verify
        ./scripts/build-fonts.py --verify   # verify committed files only, no network

REQUIREMENTS
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    Run with that interpreter.

THE TWO THINGS THAT ARE EASY TO GET WRONG
    1. The unicode-ranges are Google's own `latin` + `vietnamese` blocks. The
       Vietnamese half is NOT optional — essentially every string in this panel
       carries diacritics, and a font missing them falls back per-glyph, which is
       how you get two typefaces inside one word.
    2. DO NOT add a 500 or 600 face. Times New Roman has neither, so the panel's
       331 `font-medium` elements resolve down to 400 today and its 62
       `font-semibold` resolve up to 700. Declaring the four styles Tinos has —
       and no more — is what reproduces today's rendering. Adding a real 500
       would silently make 331 elements heavier on every screen.
"""
from __future__ import annotations

import argparse
import os
import sys
import urllib.request

from fontTools.subset import main as subset_main
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, "..", "src", "fonts")
WORK_DIR = os.path.join(HERE, "..", ".font-build")  # scratch: TTF downloads

# Copied verbatim from the Google Fonts CSS2 response for Tinos (the `/* latin */`
# and `/* vietnamese */` blocks), so the shipped coverage matches what Google
# would have served had we used next/font/google.
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,"
    "U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
    "U+FEFF,U+FFFD"
)
VIETNAMESE = (
    "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,"
    "U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB"
)

# Three characters this panel RENDERS that Google's `latin` block does not carry
# (it ships U+2191 and U+2193 but not U+2192). Each was found by sweeping every
# non-ASCII character in src/ and separating rendered JSX/locale text from code
# comments — the em-dash rulers and the `Cài đặt → Vị bánh` arrows in comments do
# not need glyphs; these do:
#   U+2192 →  CampaignsTable.tsx:108, OrderAuditTrail.tsx:101
#   U+2260 ≠  ImageSizeWarningModal.tsx:57
#   U+25BC ▼  CategoriesTable.tsx:244 (the expand/collapse toggle)
# All three exist in system Times New Roman today, so omitting them would make
# them fall back to a different face — a visible change, which is the one thing
# R34 promises not to cause.
PANEL_EXTRAS = "U+2192,U+2260,U+25BC"

UNICODES = f"{LATIN},{VIETNAMESE},{PANEL_EXTRAS}"

UPSTREAM = "https://raw.githubusercontent.com/google/fonts/main/ofl/tinos"

# style key -> (upstream TTF, shipped woff2, system Times counterpart to prove against)
FACES = {
    "400": ("Tinos-Regular.ttf", "tinos-400.woff2",
            "/System/Library/Fonts/Supplemental/Times New Roman.ttf"),
    "700": ("Tinos-Bold.ttf", "tinos-700.woff2",
            "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf"),
    "400i": ("Tinos-Italic.ttf", "tinos-400-italic.woff2",
             "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf"),
    "700i": ("Tinos-BoldItalic.ttf", "tinos-700-italic.woff2",
             "/System/Library/Fonts/Supplemental/Times New Roman Bold Italic.ttf"),
}

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36")

# Every character the panel renders that Times New Roman can draw: printable
# ASCII, the full Vietnamese alphabet in both cases, the đồng sign, the
# typographic punctuation the UI uses, and PANEL_EXTRAS. Coverage and width
# parity are asserted over exactly this set.
VN_LOWER = "àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ"
TEXT_CHARS = sorted(set(
    [chr(c) for c in range(0x20, 0x7F)]
    + list(VN_LOWER) + list(VN_LOWER.upper())
    + list("₫“”‘’–—…•·×±«»− ›")
    + list("→≠▼")
))

# Icon-ish characters the panel also renders which system Times New Roman does
# **not** contain, so they already fall back to another face today (Apple
# Symbols, Segoe UI Symbol, Noto Symbols…). Tinos does not contain them either,
# which is why the fallback behaviour is unchanged by R34 — including the
# pre-existing oddity that the category toggle draws ▼ in the text font and ▶ in
# a fallback. Not asserted as a failure: if an upstream Tinos release ever adds
# one, that is a visual change worth a human deciding about, not a broken build.
FALLBACK_CHARS = "⚠↳✕⌘⋯✓▶⋮"

# Metrics CSS uses to build a line box. capHeight/xHeight are deliberately NOT
# here: they differ between Tinos and Times (654 vs 662, 458 vs 447 per 1000em)
# and they move no layout — they describe how the glyphs are drawn, and Tinos is
# a redrawing, not a clone. Asserting on them would fail the build for a
# difference that is invisible in a page.
LAYOUT_METRICS = ("upem", "ascender", "descender", "lineGap", "typoAsc", "typoDesc")


def fetch(url: str) -> bytes:
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA})
    ).read()


def measure(path: str) -> tuple[dict[str, int | None], dict[str, int]]:
    """Advance widths (per 1000 em) for TEXT_CHARS + FALLBACK_CHARS, plus the
    layout metrics. A `None` width means the face has no glyph for that char."""
    font = TTFont(path, fontNumber=0)
    upem = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    widths: dict[str, int | None] = {}
    for ch in TEXT_CHARS + list(FALLBACK_CHARS):
        glyph = cmap.get(ord(ch))
        widths[ch] = (hmtx[glyph][0] * 1000 // upem) if glyph else None
    metrics = {
        "upem": upem,
        "ascender": font["hhea"].ascender * 1000 // upem,
        "descender": font["hhea"].descender * 1000 // upem,
        "lineGap": font["hhea"].lineGap * 1000 // upem,
        "typoAsc": font["OS/2"].sTypoAscender * 1000 // upem,
        "typoDesc": font["OS/2"].sTypoDescender * 1000 // upem,
    }
    return widths, metrics


def build() -> None:
    os.makedirs(WORK_DIR, exist_ok=True)
    os.makedirs(FONT_DIR, exist_ok=True)
    for key, (ttf, woff2, _) in FACES.items():
        raw = os.path.join(WORK_DIR, ttf)
        if not os.path.exists(raw):
            print(f"  download {ttf}")
            with open(raw, "wb") as fh:
                fh.write(fetch(f"{UPSTREAM}/{ttf}"))
        out = os.path.join(FONT_DIR, woff2)
        print(f"  subset   {ttf} -> src/fonts/{woff2}")
        subset_main([
            raw,
            f"--unicodes={UNICODES}",
            "--flavor=woff2",
            "--layout-features=*",       # keep kerning/ligatures: they affect width
            "--no-hinting",
            # Keep the OFL notice inside the binary. pyftsubset's default name-ID
            # set retains the copyright (ID 0) but DROPS the license description
            # (13) and license URL (14) — and OFL clause 2 requires the copyright
            # notice *and* the license to travel together. src/fonts/OFL.txt
            # covers anyone who has the repo, but Next serves these files at bare
            # /_next/static/media/*.woff2 URLs, detached from it; embedding the
            # records means a single extracted .woff2 still carries its licence.
            # NOTE: the committed files predate this flag, so they carry only
            # ID 0 until the next regeneration.
            "--name-IDs+=13,14",
            f"--output-file={out}",
        ])


def verify() -> bool:
    ok = True
    for key, (_, woff2, times_path) in FACES.items():
        shipped = os.path.join(FONT_DIR, woff2)
        print(f"\n=== {woff2}  vs  {os.path.basename(times_path)} ===")
        if not os.path.exists(shipped):
            print("  MISSING — run without --verify to build it")
            ok = False
            continue

        tinos_w, tinos_m = measure(shipped)
        size_kb = os.path.getsize(shipped) / 1024

        missing = [c for c in TEXT_CHARS if tinos_w[c] is None]
        if missing:
            ok = False
            print(f"  COVERAGE  FAIL — {len(missing)} rendered glyph(s) absent: "
                  f"{''.join(missing)}")
        else:
            print(f"  coverage  OK   — {len(TEXT_CHARS)}/{len(TEXT_CHARS)} rendered "
                  f"glyphs incl. all Vietnamese  ({size_kb:.0f} KB)")

        if not os.path.exists(times_path):
            print("  metrics   SKIPPED — no system Times New Roman on this machine "
                  "(run the proof on macOS)")
            continue

        times_w, times_m = measure(times_path)

        # The fallback set must stay absent from BOTH faces, or a glyph silently
        # changes typeface. A warning, not a failure — see FALLBACK_CHARS.
        gained = [c for c in FALLBACK_CHARS
                  if times_w[c] is None and tinos_w[c] is not None]
        if gained:
            print(f"  fallback  WARN — Tinos now draws {''.join(gained)}, which Times "
                  "does not: these icons will change appearance. Decide deliberately.")
        else:
            print(f"  fallback  OK   — {FALLBACK_CHARS} absent from both, so the "
                  "system-fallback icons render as they do today")

        diffs = {c: (times_w[c], tinos_w[c]) for c in TEXT_CHARS
                 if times_w[c] is not None and tinos_w[c] is not None
                 and times_w[c] != tinos_w[c]}
        compared = sum(1 for c in TEXT_CHARS
                       if times_w[c] is not None and tinos_w[c] is not None)
        if diffs:
            ok = False
            print(f"  widths    FAIL — {len(diffs)}/{compared} advance widths differ; "
                  "the panel WILL reflow. First 10:")
            for c, (a, b) in list(diffs.items())[:10]:
                print(f"      {c!r}: Times {a} -> Tinos {b}")
        else:
            print(f"  widths    OK   — {compared}/{compared} advance widths identical")

        bad = [m for m in LAYOUT_METRICS if times_m[m] != tinos_m[m]]
        if bad:
            ok = False
            print("  metrics   FAIL — line-box metrics differ: "
                  + ", ".join(f"{m} {times_m[m]}->{tinos_m[m]}" for m in bad))
        else:
            print("  metrics   OK   — " + ", ".join(f"{m}={tinos_m[m]}"
                                                    for m in LAYOUT_METRICS))
    return ok


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true",
                    help="verify the committed files only; no network access")
    args = ap.parse_args()

    if not args.verify:
        print("Building src/fonts/ from upstream Tinos …")
        build()

    print("\nProving the shipped faces are metrically Times New Roman …")
    ok = verify()
    print("\n" + "=" * 68)
    if ok:
        print("PASS — layout cannot shift; Vietnamese fully covered.")
    else:
        print("FAIL — do NOT commit this output. See the failures above.")
    print("=" * 68)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
