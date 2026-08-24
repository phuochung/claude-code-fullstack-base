# Backlog

Working list of things we want to do. Not a commitment and not a sprint plan —
somewhere nothing gets lost.

Groom an item into [docs/tickets/](docs/tickets/README.md) when you're ready to
act on it; this file stays the home for everything deferred.

## Template gaps

- **Clear the dashboard ESLint backlog** (~47 problems, mostly
  `no-explicit-any`). `tsc --noEmit` and `next build` are clean; lint is not, so
  it cannot gate CI yet.
- **No tests in the dashboard.** The backend has 123; the dashboard has none and
  no test runner configured. The three list-page hooks (`useListPage`,
  `useSearchKeyword`, `useAsyncAction`) carry the most logic and the least
  coverage.

## Nice to have

- **Schedule the storage cleanup.** `POST /internal/storage/cleanup` deletes
  orphaned uploads older than 7 days but nothing calls it — it needs a cron.
- **A public website service.** The backend already has `client/*` controllers,
  the `WEBSITE_AUTH_TOKEN` guard and a `website` i18n namespace for one.
- **Backend build config.** The dashboard has `cloudbuild.yaml`; the backend has
  only a `Dockerfile` and `docker-compose.yml`.
- **Cookie-name drift guard.** The dashboard's `AUTH_COOKIE_NAME` and the
  backend's `COOKIE_NAME` must match and are asserted only by convention. A
  startup check or a shared constant would make the failure loud instead of
  "login succeeds, every request is anonymous".
- **Error-report coverage for the reporter itself.** `lib/report-admin-error.ts`
  encodes the backend DTO's caps by hand. A test asserting each truncation lands
  at `<= limit` would catch the off-by-one that silently 400s long stacks.

## Done

- ~~Self-host the UI font~~ — Tinos 400/700 (+italics), `next/font/local`,
  ~64KB in `src/fonts/`. Inline `<body>` style and the dead `--font-outfit`
  token both removed; verified with a network-blocked build.
- ~~`min-w-0` on the admin content column~~ — wide tables no longer scroll the
  whole page sideways.
- ~~Error boundaries~~ — `app/error.tsx`, `app/global-error.tsx` and
  `instrumentation-client.ts` now report to `POST /api/admin/errors`.
- ~~Remove vestigial `src/i18n.ts`~~ — deleted along with the unused `next-intl`
  dependency; the hand-rolled `I18nContext` is now the only i18n system.
