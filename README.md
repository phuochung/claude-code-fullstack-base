# Base — a fullstack workspace wired for Claude Code

A two-service starter (NestJS + MongoDB API, Next.js admin dashboard) set up as a
**Claude Code workspace** rather than just a pair of templates.

Most starters give you code. The useful part here is the context around it: a
`CLAUDE.md` per service that records the decisions the code cannot state itself —
why `TRUST_PROXY` is a hop count and not `true`, why a CKEditor plugin that looks
unused will silently delete stored content if removed, which of three rate-limit
brakes actually holds under a botnet. That is the context an agent needs to change
this code without quietly breaking it, and the part that is normally lost.

MIT licensed. Not a hosted product, not a framework — a starting point you own.

## What's in it

| | |
|---|---|
| [src/base-nestjs-backend](src/base-nestjs-backend) | NestJS 11 · MongoDB/Mongoose · Passport JWT · GCS · nestjs-i18n · 123 tests |
| [src/base-nextjs-dashboard](src/base-nextjs-dashboard) | Next.js App Router · React 19 · Tailwind v4 · CKEditor 5 · ApexCharts |

Included out of the box: cookie-based admin auth with route middleware, CRUD for
blog/category/tag/customer/users with soft deletes and audit trails, image upload
to Google Cloud Storage with orphan cleanup, user-defined custom fields, i18n
(`en` + `vi`) on both sides, per-route rate limiting, and Slack error alerting
with output escaping and PII redaction.

## Start here

You do not have to set this up by hand. Take a copy, open Claude Code, and point
it at the first ticket:

```bash
# "Use this template" on GitHub, or fork, then clone your copy.
# The last argument names the folder — call it after your product.
git clone <your-repo-url> my-product
cd my-product
claude
```

Then say:

> Read `docs/tickets/G01` and do it.

That gets you a running install — dependencies, generated secrets, a MongoDB
check, a seeded admin, and both dev servers up — and it verifies each step rather
than assuming it worked. From there the on-ramp continues:

| Ticket | What it does |
|---|---|
| [G01 — Get it running](docs/tickets/G01-get-it-running.md) | Local install, seeded admin, both servers up, sign-in confirmed |
| [G02 — Make it yours](docs/tickets/G02-make-it-yours.md) | Executes [SETUP.md](SETUP.md) — renames every template default that breaks things if it ships, the auth cookie name above all |
| [G03 — Your first module](docs/tickets/G03-first-module.md) | One entity end to end: schema → API → list, detail, create, edit |
| [G04 — Add another service](docs/tickets/G04-add-a-service.md) | A website, mobile app, or worker under `src/` |

By the end of G03 you have your own domain running on your own branding, and you
are just building. Prefer to drive it yourself? Every ticket is a plain markdown
file with the commands in it — read [G01](docs/tickets/G01-get-it-running.md) and
run them.

Requires Node 22+ and MongoDB (G01 offers a one-line Docker option if you have
neither).

## Why the tickets instead of a setup guide

A setup guide goes stale and gets skipped. A ticket states what "done" means, so
an agent can check its own work — and you can see exactly what it did. It is also
the same convention you will use for real work afterwards, so the on-ramp teaches
the workflow rather than being a detour from it. See
[docs/tickets/](docs/tickets/README.md).

## `src/` holds as many services as you need

The two shipped here are the pair almost every product starts with, not a fixed
shape:

```
src/
├── base-nestjs-backend/     API + MongoDB — the source of truth
├── base-nextjs-dashboard/   internal admin panel
└── <your-product>-website/  ← add a storefront, a mobile app, a worker…
```

The backend is already built for more surfaces: `client/*` controllers separate
from `admin/*`, a `WEBSITE_AUTH_TOKEN` guard that fails closed until you set it,
`internal/*` plus `INTERNAL_AUTH_TOKEN` for service-to-service calls, a `website`
i18n namespace, and an error-report endpoint for a public frontend. [G04](docs/tickets/G04-add-a-service.md)
wires a new service into the workspace file, the dev tasks and the docs so Claude
picks it up like the others.

Each service keeps its own `CLAUDE.md`. That is the rule that makes the workspace
scale: the root file covers what spans services, each service explains itself.

## Using it with Claude Code

Open the workspace root and Claude picks up:

- [CLAUDE.md](CLAUDE.md) — how the services relate, and the cross-surface
  consistency checklist that catches the "changed it in one place only" class of
  bug.
- A per-service `CLAUDE.md`
  ([backend](src/base-nestjs-backend/CLAUDE.md) ·
  [dashboard](src/base-nextjs-dashboard/CLAUDE.md)) — stack, conventions, and the
  load-bearing decisions, plus an honest **Known gaps** list rather than a clean
  façade.
- [.claude/settings.json](.claude/settings.json) — a permission allowlist for
  builds, tests and read-only git, so routine verification stops prompting.
  Deliberately excludes anything that mutates state.
- [docs/tickets/](docs/tickets/README.md) — the G-series above, plus the
  convention and template for your own work.

No custom agents or MCP servers required. Works the same in the Claude Code CLI,
the desktop app, or the VS Code extension — open `base.code-workspace` for the
editor to see every service as a folder.

## Security posture

Worth knowing before you deploy, because several checks fail startup rather than
degrade quietly:

- **Weak secrets are rejected at boot** in production — under 32 chars, or
  matching a hand-written shape (`your-`, `changeme`, `@2026`). A present-but-
  guessable token is never caught at request time, so startup is the only place
  it can be caught.
- **Unset secrets fail closed.** A blank token disables that surface entirely
  rather than opening it.
- **`CORS_ORIGIN` is mandatory in production** — browsers reject `*` with
  credentials, so a missing value would break cookie auth silently.
- **Static-key comparison is constant-time** (`crypto.timingSafeEqual`).
- **Slack-bound text is escaped at the sink**, so a reported stack trace cannot
  inject `<!channel>`; request bodies are redacted by field name before an alert
  leaves the process.
- **Rate limiting keys on a hop count, not `X-Forwarded-For` trust** — see
  [SETUP.md](SETUP.md) §6.

Found a problem? Open an issue — or see [CONTRIBUTING.md](CONTRIBUTING.md) to
fix it yourself. Security-sensitive findings go through
[SECURITY.md](SECURITY.md), not the public tracker.

## Credits

The dashboard began as
[TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) (MIT) and
has diverged substantially. Both services are MIT — see [LICENSE](LICENSE).

The bundled UI typeface is [Tinos](https://github.com/googlefonts/tinos) by Steve
Matteson, under the SIL Open Font License 1.1 — the license travels with the font
files in
[src/base-nextjs-dashboard/src/fonts/OFL.txt](src/base-nextjs-dashboard/src/fonts/OFL.txt),
as OFL requires. The shipped `.woff2` files are subsets; Tinos declares no
Reserved Font Name, so the subsets keep the family name.

The dashboard's rich-text editor, CKEditor 5, is GPL-2.0-or-later (not MIT).
That only matters if you distribute a built copy of the dashboard — see the
[dashboard README](src/base-nextjs-dashboard/README.md#license) for details.
