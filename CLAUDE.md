# Base — workspace root

Starter workspace for a multi-service product, pre-wired for Claude Code. Two
services ship here; `src/` takes as many as the product needs. Each has its own
`CLAUDE.md` — **read those for stack, ports, env vars and per-service
conventions.** This file covers only what spans them.

| Service | Role | Details |
|---------|------|---------|
| [src/base-nestjs-backend](src/base-nestjs-backend) | NestJS + MongoDB API (source of truth) | [CLAUDE.md](src/base-nestjs-backend/CLAUDE.md) |
| [src/base-nextjs-dashboard](src/base-nextjs-dashboard) | Internal admin panel (Next.js) | [CLAUDE.md](src/base-nextjs-dashboard/CLAUDE.md) |

**If someone has just cloned this, they are probably here to be walked through
it.** The shipped `G##` tickets in [docs/tickets/](docs/tickets/README.md) are the
on-ramp, and they are written to be executed by you, not read by a human:

| | |
|---|---|
| [G01](docs/tickets/G01-get-it-running.md) | Get it running locally — deps, secrets, Mongo, seeded admin, both servers |
| [G02](docs/tickets/G02-make-it-yours.md) | Rename every template default, per [SETUP.md](SETUP.md) |
| [G03](docs/tickets/G03-first-module.md) | First module end to end |
| [G04](docs/tickets/G04-add-a-service.md) | Add a website / mobile app / worker under `src/` |

Prefer them over improvising a setup: they carry the checks. If a request maps
onto one ("help me set this up", "make this mine", "add a products page"), read
that ticket first and follow it, then write its Result section. Ask before
installing system software or overwriting an existing `.env`.

Work tracking: [BACKLOG.md](BACKLOG.md) + [docs/tickets/](docs/tickets/README.md)
(`R##` for real work, `G##` is the shipped starter set).
Design docs: [docs/plans/](docs/plans/).

## The backend is the single source of truth

The dashboard writes and reads data exclusively through the backend API. It holds
no data logic of its own and no credential of its own — what it displays is
decided by the backend's endpoints. When a behaviour looks wrong in the panel,
establish which side owns it before editing either.

## `src/` is extensible

The two services here are the usual starting pair, not a fixed shape. A public
website, a mobile app, a worker or a tools package all belong beside them as
`src/<product>-<kind>/`, and the backend
is already built for them: `client/*` controllers kept separate from `admin/*`, a
`WEBSITE_AUTH_TOKEN` guard that fails closed until set, `internal/*` plus
`INTERNAL_AUTH_TOKEN` for service-to-service calls, a `website` i18n namespace,
and `POST /api/client/errors` for a public frontend's error reports.

Two rules when adding one, both in [G04](docs/tickets/G04-add-a-service.md):
**every service gets its own `CLAUDE.md`** (that is what keeps this workspace
legible as it grows — this root file covers only what spans services), and it
must be registered in `base.code-workspace`, `.vscode/tasks.json` and the table
above, or the tooling and the next agent will not know it exists.

**One repo.** This is a monorepo — never create a nested `.git` inside
`src/<service>`.

## Cross-surface consistency

This is a multi-surface system. When a feature adds or changes a status /
visibility / availability concept, **enumerate every surface that displays it and
keep them consistent** — the step easiest to skip and most likely to leave a gap.

Pay particular attention to **derived state**: an outcome governed by more than
one flag. If a record is publicly visible only when its own status *and* its
parent's status are published, then every view showing "is this visible?" must
reflect the combination, not one flag — otherwise the panel reads "Published"
while the public surface has actually hidden it.

Checklist when introducing or changing such a concept:

1. **Backend** — the field, its default, and the `client/*` query behaviour.
   No data migration should be needed for existing documents: pick defaults and
   query predicates (`$ne`, not `$eq`) so a missing field reads as the safe
   legacy value.
2. **Dashboard** — both the *editor* (how an admin sets it) **and** every *read
   view* (tables, detail pages) where the resulting state appears. Derived state
   must be surfaced here, not just the raw flag.
3. **Any public surface** — usually verification rather than new code, since it
   is backend-driven.

## Conventions that apply to both repos

- **Language: English.** Code, comments, commit messages, docs and default UI
  copy. Translations live only in locale files (`src/i18n/<lang>/*.json` in the
  backend, `src/locales/*.json` in the dashboard). The one deliberate exception
  is a language's own name in a language picker.
- **Never commit unless asked.** No auto-commits, and when executing a written
  plan skip its commit/git steps — commits are made by hand.
- **Verify before claiming done.** `npx tsc --noEmit` in both, `npm test` in
  both, `npm run lint` and `next build` in the dashboard. State what you ran.
- **Secrets are generated, never hand-written** (`openssl rand -hex 32`). The
  backend refuses to start in production on a guessable value — see
  `shared/config/validate-secrets.ts`.
- Soft deletes and audit fields (`deleted`, `createdBy`, `deletedBy`, `deletedAt`)
  are the default for every entity, via the backend's shared base schema.

## Working agreement for feature work

Before implementing anything that touches more than one surface, do a short
**design pass** first: restate the intent, then list the surfaces above and what
changes on each. Going straight to code on the literal request is how the
"consistent everywhere?" question gets missed.
