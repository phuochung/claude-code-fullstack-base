# Dashboard (Admin)

- Framework: Next.js (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4 + PostCSS (no `tailwind.config` — tokens live in `globals.css` under `@theme`)
- Port: 3001 (`npm run dev`). Note `next start` defaults to 3000.
- Output: `standalone` (required for the Docker build)
- Derived from [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) (MIT)

## Connects to

- Backend API: `NEXT_PUBLIC_API_URL` (default `http://localhost:8080/api`)
- Website: `NEXT_PUBLIC_WEBSITE_URL` (default `http://localhost:3002`)

**`NEXT_PUBLIC_*` is inlined at build time**, and `next build` reads `.env.production`. A plain local production build therefore ships a bundle pointing at whatever that file says — serving it locally sends API calls to that backend. For local production-mode testing, pass the value explicitly:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run build && npx next start --port 3001
```

`src/api/base.ts` throws at module load if `NEXT_PUBLIC_API_URL` is unset in a production build, rather than silently defaulting.

## Auth: httpOnly cookie, two enforcement points

No client-side token storage. Every request uses `credentials: 'include'`.

1. **`src/middleware.ts`** gates navigation — no cookie and not a public route (`/signin`, `/signup`, `/reset-password`, `/forgot-password`) redirects to `/signin?redirect=<pathname>`; having a cookie on `/signin` redirects home.
2. **`src/api/base.ts` `handleUnauthorized()`** handles a session that expires mid-session: clears local state and redirects. It **skips the redirect when already on `/signin`**, because a failed login is also a 401 — without that guard a wrong password would loop.

`AUTH_COOKIE_NAME` in `src/constants/auth.ts` **must match the backend's `COMMON_CONSTANTS.COOKIE_NAME`.** Rename both together per product: two products under one parent domain sharing a cookie name overwrite each other's sessions. `AUTH_COOKIE_MAX_AGE` must likewise track the backend's JWT expiry.

## State and data

No global state library — five React Contexts (`Sidebar`, `Theme`, `Toast`, `I18n`, `ImageViewer`), all stacked in the root layout.

The API layer is `src/api/base.ts` (fetch wrapper, error normalisation to `ApiException`, the 401 handler) plus one service file per resource in `src/api/services/`. Add a resource by adding a service file — don't call `fetch` from a component.

## List pages: three hooks that belong together

Every table page is `useListPage` + `useSearchKeyword` + `ResponsiveTable`.

- **`useListPage`** owns URL-backed filter state (`page`, `limit`, `sortBy`, `sortOrder`, `keyword`). Filters live in the URL so a list view is deep-linkable and survives back/forward.
- **`useSearchKeyword`** keeps the search box local while the admin types and commits on submit. It also has to follow the *committed* keyword back down when that changes upstream (clearing filters, a deep link, browser back) — otherwise "Clear Filters" empties the results but leaves a stale term in the box. Its effect is keyed on the committed value alone, never the whole filter object, so changing a neighbouring filter cannot revert a keyword being typed.
- **`ResponsiveTable`** renders a desktop table and a mobile card list from one column definition, via a per-column `mobile` role: `media` / `title` / `subtitle` / `badge` / `body` / `actions` / `none`. Both renderings are always in the DOM with one hidden by a media query, so cells render twice — deliberate, because cells are pure and pages are 10–20 rows. Wide tables scroll inside their own card with the `actions` column pinned right.

## Typography: Tinos, self-hosted, 400/700 only

The panel used to declare `font-family: 'Times New Roman', Times, serif` and ship **no font bytes**, so every device rendered it in whatever serif it owned — macOS and Windows have Times, Android substitutes a wider Noto serif, most Linux has neither. Every text box changed size per platform, which meant any layout measured on a Mac was measured against a font a large share of real devices lack.

- **One declaration, one path.** `next/font/local` in [app/layout.tsx](src/app/layout.tsx) publishes `--font-tinos`; `globals.css` maps it to `--font-serif`; `body` gets `font-serif`. There is **no inline `style` on `<body>`** any more (it used to set the font and outranked the stylesheet, which made `globals.css` a misleading place to look), and no `--font-outfit` — a token for a font that was never loaded, `@apply`d onto `body` and then overridden on the next line.
- **Self-hosted (`src/fonts/*.woff2`, ~64KB) and it must stay that way.** `next/font/google` downloads the binaries from fonts.gstatic.com *during `next build`*, making Google Fonts a hard dependency of every deploy — and a `--no-cache` CI build re-fetches every time, so an upstream purge fails the build on an unchanged commit. Verify with a network-blocked build: `https_proxy=http://127.0.0.1:1 npm run build` must still succeed.
- **Tinos is metrically compatible with Times New Roman**, which is why adopting it moved nothing on machines that have Times. Cheap independent check: the `adjustFontFallback` face Next emits is `src: local(Times New Roman)` with **`size-adjust: 100.0%`** — Next measured the two itself and found no scaling needed. [scripts/build-fonts.py](scripts/build-fonts.py) regenerates the subset and proves it glyph-by-glyph; it needs `pip install fonttools brotli`. Run it (never as part of `npm run build`) when taking an upstream release or changing the subset, and **do not commit output it reports as FAIL**.
- **Never add a 500 or 600 face.** Times has neither, so the panel's 193 `font-medium` elements resolve down to 400 today and its 20 `font-semibold` resolve up to 700. Declaring only the four styles Tinos has reproduces exactly that. A real 500 would silently make 193 elements heavier everywhere.
- **`--font-*: initial` wipes Tailwind's default families**, so `font-serif` exists only because `globals.css` defines it — and `font-sans` does **not** exist. `Logo.tsx` carried a `font-sans` class for a long time that emitted no CSS, so the wordmark always rendered in the panel serif; it has been removed rather than left to mislead. Restoring a sans wordmark means defining a `--font-sans` token *and* loading a face.
- **The OFL travels with the fonts.** Tinos is SIL Open Font License 1.1, and OFL requires the copyright notice and license to accompany the font software wherever it is redistributed — including subset `.woff2` embedded in an app. That is `src/fonts/OFL.txt`; **do not delete it or move the fonts away from it.** Tinos declares no Reserved Font Name (the only mention in the license is the boilerplate definition), so subsetting while keeping the family name is permitted. Upstream is `googlefonts/tinos`; Google Fonts' own `ofl/tinos` directory has the TTFs but no license file, which is why the text here comes from the project repo. `build-fonts.py` also passes `--name-IDs+=13,14` so regenerated `.woff2` carry the license *inside* the binary — the standalone file only helps someone who has the repo, and Next serves these at bare `/_next/static/media/*.woff2` URLs where a single extracted file would otherwise travel with no license at all. The committed binaries predate that flag and carry only the copyright record (ID 0).
- **`<html lang>` participates in font fallback** for any glyph the primary face lacks, not just accessibility. It is `en` here because the panel defaults to English; change it if a deployment runs primarily in another language.

## Layout: `min-w-0` on the admin content column

`app/(admin)/layout.tsx` gives the main content column `min-w-0`. **Do not remove it** — it is what keeps the *page* from scrolling sideways.

A flex item defaults to `min-width: auto`, which refuses to shrink below its content's min-content width, and that measurement passes straight through a table's `overflow-x-auto` wrapper: the zero-minimum rule for scroll containers applies to the flex item itself, never to a descendant. So a wide table's columns propagate up, make the content column wider than the viewport, and scroll the whole page — sliding the breadcrumb under the fixed sidebar — while the table itself never scrolls at all.

It only breaks from `xl` up, where `xl:flex` is on; below that a plain block has no such minimum, so it is easy to miss when testing narrow.

## i18n: the hand-rolled context is the real one

`src/context/I18nContext.tsx` + `src/locales/{en,vi}.json`. Default locale is **`en`** (`DEFAULT_LOCALE`), and English is imported statically so the first render has real strings rather than raw keys; other locales load on demand and are cached. An explicit choice persists in `localStorage.locale` and wins over the default.

`t()` returns **the key itself** when it cannot resolve. So:

- **Every key a component calls must exist in both locale files.** Audit before shipping — a missing key is invisible in review and obvious in production.
- Don't hardcode UI strings. `src/components/auth/SignInForm.tsx` is the cautionary example: it once hardcoded a Vietnamese heading beside English labels because it never called `t()` at all, while fully translated `auth.signIn.*` keys sat unused.

Language names in the picker (`"Tiếng Việt"`) are deliberately **not** translated — a language is conventionally labelled in its own language.

## Icons: keep `removeViewBox: false`

SVGs in `src/icons/` compile to React components via `@svgr/webpack`, configured for **both** bundlers in `next.config.ts` (dev runs Turbopack, `next build` runs webpack).

SVGO's `preset-default` strips `viewBox`, and an SVG with no `viewBox` has no coordinate system — a CSS box *smaller* than the icon's intrinsic size then **crops it to the top-left corner instead of scaling it down** (`size-4` on a 24×24 icon showed two thirds of a calendar). The config overrides that. Keep the option if the loader config is ever touched, and keep `dimensions` on: bare `<Icon />` usages rely on the intrinsic `width`/`height`.

## CKEditor 5: the plugin list is load-bearing

`src/components/common/CKEditorWrapper.tsx` uses the **single `ckeditor5` package**, not the deprecated `@ckeditor/ckeditor5-build-classic`. There is no prebuilt bundle, so `config.plugins` is explicit — and **CKEditor filters content on load**, meaning anything no loaded plugin claims is dropped from the model and silently deleted the next time an admin saves.

Two entries look removable and are not:

- **`Image*`** — no image button exists, but without them a stored `<figure class="image">` round-trips down to `<p>caption</p>`.
- **`GeneralHtmlSupport`, narrowly scoped** — it preserves markup that would otherwise be destroyed on save. Keep it narrow: a permissive `attributes/classes/styles: true` also preserves Word cruft (`class="MsoNormal"`, `font-family`), which then overrides the site's own typography.

`licenseKey: "GPL"` is mandatory from v44 (free, and the licence already in force), and the stylesheet is a separate `import "ckeditor5/ckeditor5.css"`.

Rendered blog HTML is sanitised with `isomorphic-dompurify` in `BlogDetail.tsx`.

## Error reporting — three catch points

Every uncaught error should reach Slack within seconds, tagged `dashboard`, via the backend's `POST /api/admin/errors`.

- **Three catch points**, all funnelling through `lib/report-admin-error.ts`: `app/error.tsx` (segment render crashes), `app/global-error.tsx` (root-layout crashes — the layout stacks five providers, so this is not hypothetical), and `src/instrumentation-client.ts` (`window` `error` + `unhandledrejection`, which on a panel this client-heavy is most of what happens).
- **Never report through `apiClient`.** Its 401 handler *redirects to `/signin`*, so an expired session would throw the admin off the page they were on because reporting a crash failed. The reporter uses a bare `fetch` with `credentials: 'include'`.
- **The payload is an allow-list.** The backend DTO sets `forbidNonWhitelisted`, so one undeclared field makes the whole report a 400. `userAgent` is read from the request header server-side and must not be sent; the admin DTO has no `source` field.
- **Truncation must land at or below each cap.** The backend rejects at exactly the limit, so slicing to `max` and then appending an ellipsis gives `max + 1` and 400s the report — silently dropping the long stacks, which are the ones worth having.
- **Boundary copy is hardcoded English, not `useI18n()`.** The provider loads messages asynchronously from the root layout, so a boundary depending on it renders raw keys exactly when something is wrong. `global-error.tsx` additionally uses inline styles and no providers: the layout that failed is what loads the stylesheet and the theme.
- **Extension noise is dropped by provenance, not message.** `isExtensionStack` ignores an error only when *every* frame is on an extension scheme, so a real error that merely passed through an extension still reports.
- **Pre-login crashes are not reported**, deliberately: the endpoint needs the admin JWT cookie, and an unauthenticated report endpoint on a public URL is a spam surface.

## Lint and tests

- **`npm run lint` is clean — keep it that way.** Where a rule flags a
  deliberate pattern (`react-hooks/set-state-in-effect` on edit-form entity
  sync, SSR/localStorage hydration, and the `useSearchKeyword` follow-down),
  the site carries a one-line scoped `eslint-disable` stating the reason.
  Extend that convention for a new deliberate site; never disable a rule
  globally or let a backlog re-form.
- **Tests are Vitest + Testing Library** (`npm test`), colocated as `*.test.ts`
  next to the unit — mirroring the backend's `*.spec.ts` convention. The two
  suites pin behaviours this file documents as deliberate:
  `report-admin-error` (allow-list payload, truncation landing exactly at each
  cap, extension-stack provenance, dedupe) and `useSearchKeyword` (committed
  keyword follows down; unrelated re-renders never clobber typing). Keep them
  green and extend them when touching those behaviours.

## Scripts

```
npm run dev          # port 3001
npm run build
npm run start        # port 3000 unless --port is passed
npm run lint         # eslint src/ — clean, zero errors and warnings
npm test             # Vitest, colocated *.test.ts
npm run type-check   # tsc --noEmit, clean
```
