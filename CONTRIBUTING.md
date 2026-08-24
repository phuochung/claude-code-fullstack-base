# Contributing

Thanks for helping improve this template. Issues and pull requests are welcome.

## Getting set up

Follow [docs/tickets/G01](docs/tickets/G01-get-it-running.md) — it walks through
dependencies, secrets, MongoDB, the seeded admin, and both dev servers, and it
checks its own work. Node 22+ is required (`.nvmrc` is at the repo root).

## Before you open a PR

Run the verification gates for every service you touched, and say in the PR
which ones you ran:

| Service | Gates |
|---|---|
| `src/base-nestjs-backend` | `npx tsc --noEmit` · `npm test` |
| `src/base-nextjs-dashboard` | `npx tsc --noEmit` · `npm test` · `npm run lint` · `npm run build` |

All of them pass clean on `main`; a PR that leaves one red needs to explain why.

## Conventions

The short version — each service's `CLAUDE.md` carries the details:

- **English everywhere** — code, comments, commits, docs, and default UI copy.
  Translations live only in the locale files.
- **Every entity soft-deletes** and carries audit fields, via the backend's
  shared base schema. Queries must exclude soft-deleted rows themselves.
- **Secrets are generated, never hand-written** (`openssl rand -hex 32`).
  Nothing that looks like a real credential belongs in a commit — only
  `.env.example` is tracked, with placeholder values.
- **Locale files stay complete.** Every i18n key a component or exception can
  reach must exist in both `en` and `vi`, or it surfaces to users as the raw
  key string.
- **One repo.** Never create a nested `.git` inside `src/<service>`.
- A new service under `src/` gets its own `CLAUDE.md` and must be registered in
  `base.code-workspace` and `.vscode/tasks.json` — see
  [docs/tickets/G04](docs/tickets/G04-add-a-service.md).

## Reporting security issues

Not in the issue tracker — see [SECURITY.md](SECURITY.md).
