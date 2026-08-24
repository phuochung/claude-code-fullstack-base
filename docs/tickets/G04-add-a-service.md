# G04 — Add another service under `src/`

**Status:** open
**Surfaces:** backend · new service
**Depends on:** [G02](G02-make-it-yours.md)

> Hand to Claude Code as: *"Read docs/tickets/G04 and add a public website."*
> Optional — only if your product needs a second frontend.

## Goal

`src/` is a multi-service workspace, not a fixed pair. This ticket adds a third
(or fourth) service alongside the backend and dashboard, wired to the same API
and picked up by the same workspace tooling.

Common additions:

| Service | Talks to the backend via |
|---|---|
| `src/<product>-website` — public storefront / marketing site | `client/*` endpoints + `WEBSITE_AUTH_TOKEN` |
| `src/<product>-mobile` — React Native / Expo app | `client/*` endpoints |
| `src/<product>-worker` — cron, queue consumer, importer | `internal/*` endpoints + `INTERNAL_AUTH_TOKEN` |
| `src/<product>-tools` — data scripts, migrations, scrapers | direct DB or `internal/*` |

**Ask which one, and what it must do**, before scaffolding anything.

## What the backend already provides

You are not starting from nothing — a public surface was designed for:

- **`client/*` controllers** on existing modules, separate from `admin/*`, with
  their own guards, response shapes and a looser `CLIENT` rate limit (200/min,
  higher because SSR fires several parallel requests per page load from one
  address).
- **`KeyAuthClientGuard`** — a constant-time static-bearer guard reading
  `WEBSITE_AUTH_TOKEN`. Fails closed when unset, so the surface is off until you
  set it.
- **`INTERNAL_AUTH_TOKEN`** and `internal/*` for service-to-service calls.
- **A `website` i18n namespace** (`src/i18n/{en,vi}/website.json`) already split
  out from `admin`.
- **`POST /api/client/errors`** for error reporting from a public frontend, with
  a stricter 10/min limit and the same dedupe + flood gate as everything else.

## Scope

1. **Scaffold** the service in `src/<product>-<kind>/`, matching the existing
   two: TypeScript, its own `.env.example`, its own `README.md`, its own
   `Dockerfile` if it deploys.
2. **Write its `CLAUDE.md`.** Not optional — it is the reason this workspace
   works with an agent. Cover stack, port, env vars, and any decision a future
   reader would otherwise undo. Keep it about *this* service; the root
   `CLAUDE.md` covers what spans services.
3. **Register it** in `base.code-workspace` (folder entry) and
   `.vscode/tasks.json` (a `dev` task, and add it to `dev: all`).
4. **Add it to the root [CLAUDE.md](../../CLAUDE.md) service table** and the
   README's "What's in it".
5. **Pick a port** that does not collide: backend 8080, dashboard 3001, so a
   website conventionally takes 3002 — which is already what
   `NEXT_PUBLIC_WEBSITE_URL` and the backend's default `CORS_ORIGIN` expect.
6. **Add its origin to `CORS_ORIGIN`** in the backend `.env`, or its browser
   requests will fail in a way the console explains badly.

## Things that will bite

- **A public frontend must never hold an admin credential.** If it needs data the
  `client/*` endpoints don't expose, add a `client/*` endpoint — do not point it
  at `admin/*`.
- **`WEBSITE_AUTH_TOKEN` is a server-side secret.** In Next terms that means it
  is read in a route handler or server component, never a `NEXT_PUBLIC_*` var —
  those are inlined into the browser bundle at build time.
- **The backend stays the source of truth.** A second frontend that computes its
  own visibility rules will drift from the dashboard's view of the same record.
  See the cross-surface checklist in the root `CLAUDE.md`.
- **One repo, one `git init`.** This workspace is a monorepo; do not create a
  nested `.git` inside `src/<new-service>`.

## Done when

- [ ] The new service starts on its own port and reaches the backend
- [ ] `npx tsc --noEmit` clean in it, and still clean in the other services
- [ ] It appears in `base.code-workspace`, `.vscode/tasks.json`, the root `CLAUDE.md` table and the README
- [ ] It has its own `CLAUDE.md` and `.env.example`
- [ ] `dev: all` starts every service
- [ ] Nothing secret is in a `NEXT_PUBLIC_*` variable

## Result

What was scaffolded, which endpoints it consumes, ports and env vars added, and
what remains stubbed.
