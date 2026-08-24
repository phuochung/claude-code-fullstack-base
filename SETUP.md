# Setup — turning this template into a product

Do this once, before writing any feature code. Everything below is a template
default that will cause a real problem if it survives into a deployed product.

Throughout, `<product>` is your product's short slug (lowercase, no spaces) —
e.g. `acme`.

## 1. The one that bites: the auth cookie name

Two products under the same parent domain sharing a cookie name **overwrite each
other's sessions**. Rename in both repos, together:

| File | Value | Change to |
|---|---|---|
| `src/base-nestjs-backend/src/shared/constants/constant.ts` | `COOKIE_NAME: 'auth_token'` | `auth_token_<product>` |
| `src/base-nextjs-dashboard/src/constants/auth.ts` | `AUTH_COOKIE_NAME = 'auth_token'` | the same string |

They are asserted to match only by convention, not by code — if they drift, login
appears to succeed and every subsequent request is unauthenticated.

While you are there: `AUTH_COOKIE_MAX_AGE` (dashboard) must track
`AUTH_SESSION_DAYS` (backend). Both are 30 days by default.

## 2. Generate every secret

Never hand-write these. The backend **refuses to start in production** on a value
under 32 chars or matching a hand-written shape (`your-`, `changeme`,
`secret-key`, `@20xx`) — see `shared/config/validate-secrets.ts`.

```bash
openssl rand -hex 32
```

Fill in, in the backend's `.env`: `JWT_SECRET`, `WEBSITE_AUTH_TOKEN`,
`INTERNAL_AUTH_TOKEN`, `DEV_API_SECRET_KEY`, `SEED_ADMIN_PASSWORD`.

Leave a token **blank** to disable that surface — the guards fail closed, so a
blank value refuses every request. That is safer than a placeholder.

## 3. Locale and timezone

`src/base-nestjs-backend/src/shared/constants/constant.ts` ships neutral defaults:

```ts
LANG: 'en',        // API message fallback; override per deployment with FALLBACK_LANGUAGE
LOCALE: 'en-US',   // log timestamp formatting
TIMEZONE: 'UTC',   // log timestamp timezone
```

Set `LOCALE`/`TIMEZONE` to wherever your team reads logs. Note this changes log
timestamp *formatting* — if anything parses your logs, change both together.

## 4. Names and identifiers

| Where | Template value |
|---|---|
| `src/base-nestjs-backend/package.json` | `"name": "base-nestjs-backend"` |
| `src/base-nextjs-dashboard/package.json` | `"name": "base-nextjs-dashboard"` |
| backend `.env.example` → your `.env` | `MONGODB_URI=…/projectName-dev` |
| backend `.env.example` → your `.env` | `GCP_STORAGE_BUCKET_NAME=projectName-staging` |
| `src/base-nextjs-dashboard/cloudbuild.yaml` | `tags: - base-nextjs-dashboard` |
| `LICENSE` (root and both repos) | `Copyright (c) 2025-2026 HivaLab` |
| `base.code-workspace` | rename the file and its folder paths |

Both `package.json` files are `private: true` and carry **no** `repository` /
`homepage` / `bugs` fields — the template shipped them pointing at repos that no
longer exist, and a wrong URL is worse than none. If you want them, add them
pointing at your monorepo with the npm `directory` convention:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/<you>/<repo>.git",
  "directory": "src/base-nestjs-backend"
}
```

Renaming the two service **directories** is optional but keeps things legible:
`src/<product>-backend`, `src/<product>-dashboard`. If you do, update
`base.code-workspace`, `.vscode/tasks.json`, the root `CLAUDE.md` table, and this
file's paths.

## 5. Branding in the dashboard

| File | What |
|---|---|
| `src/layout/Logo.tsx` | wordmark — `Base` / `DASHBOARD`, and the accent colour |
| `src/layout/Logo-icon.tsx` | the collapsed-sidebar / sign-in mark (same SVG) |
| `src/app/layout.tsx` | `metadata.title` — `"Base Dashboard"` |
| `src/app/(admin)/page.tsx` | `metadata.title` |
| `src/app/(full-width-pages)/(auth)/signin/page.tsx` | `metadata.title` |
| `src/app/(full-width-pages)/(auth)/layout.tsx` | the `Admin Dashboard` caption |
| `public/images/favicon.ico` | replace |
| `src/app/globals.css` | `--color-brand-*` tokens (currently `#465fff`) |

The two logo files intentionally duplicate the SVG rather than sharing a
component — they wrap it differently. Change both.

## 6. Deployment

Both services carry a `Dockerfile`. The dashboard's `cloudbuild.yaml` is fully
parameterised through substitutions (`_AR_HOSTNAME`, `_AR_PROJECT_ID`,
`_AR_REPOSITORY`, `_SERVICE_NAME`, `_DEPLOY_REGION`, `_API_URL`,
`_WEBSITE_URL`) — set them on the trigger, not in the file. The backend has a
`docker-compose.yml` for local use and no build config yet.

Remember `NEXT_PUBLIC_*` is **baked at build time**: the dashboard image is tied
to the API URL it was built with. A staging and a production image are two
builds, not one image with two configs.

Set on the backend service:

- `CORS_ORIGIN` — explicit origin list. Required; startup throws without it,
  because browsers reject `Allow-Origin: *` with credentials and the failure
  would otherwise be silent.
- `TRUST_PROXY` — a **hop count**, never `true`. `1` for Cloud Run alone; `2`
  once a load balancer is in front. See the backend `CLAUDE.md` for why `true`
  hands attackers unlimited rate-limit quota.

## 7. Seed the first admin

```bash
cd src/base-nestjs-backend
npm run seed
```

`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are required in production — without
them the seeder would create a publicly known account.

## 8. Verify

```bash
cd src/base-nestjs-backend  && npx tsc --noEmit && npm test
cd ../base-nextjs-dashboard && npx tsc --noEmit && npm run build
```

Backend: 123 tests across 11 suites. Dashboard: `tsc` and `build` are clean;
`npm run lint` has a known pre-existing backlog (~47 items) — see its `CLAUDE.md`.

## 9. Worth fixing early

See [BACKLOG.md](BACKLOG.md). Nothing there blocks a first deploy. The two most
useful early: the dashboard has **no tests** and no runner configured (the
backend has 123), and its **ESLint backlog** (~47) stops lint from gating CI.

If you change the UI typeface, read the **Typography** section of the dashboard
`CLAUDE.md` first — the font is self-hosted on purpose, and `next/font/google`
would make every deploy depend on fonts.gstatic.com being up.
