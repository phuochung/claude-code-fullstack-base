# base-nestjs-backend

**A production-grade NestJS starter you can clone and ship** — JWT auth, role-based
authorization, MongoDB, i18n, rate limiting, redacted error alerting, and a test
suite covering the security paths. Built from real client projects, with the
sharp edges already filed down and documented.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

> 🖥️ **Pairs with [base-nextjs-dashboard](../base-nextjs-dashboard)** — a Next.js
> admin dashboard in this same workspace, already wired to this API's auth,
> blogs, categories, tags, customers, custom fields, users, storage, and
> statistics endpoints.
>
> This service is one folder of a workspace. See the
> [root README](../../README.md) for the whole picture, and
> [docs/tickets/G01](../../docs/tickets/G01-get-it-running.md) for a setup that
> checks its own work.

## Highlights

- **Authentication** — Passport Local + JWT via httpOnly cookie or Bearer header;
  tokens are re-validated against the database on every request, so a blocked
  admin loses access immediately
- **Authorization** — role guard reading from the database (demotions apply at
  once), with a hidden platform-owner role that no admin can list, edit, or
  take over
- **Rate limiting** — proxy-aware throttling that can't be bypassed by forging
  `X-Forwarded-For`
- **Error alerting** — exceptions posted to Slack with credentials, cookies, and
  personal data redacted at every depth *before* logging
- **i18n** — English + Vietnamese message catalogs, resolved per request from
  `?lang=`, `Accept-Language`, or `x-lang`
- **Referential integrity** — deleting a category/tag still in use is refused
  with a count instead of silently orphaning records
- **Modules included** — auth, users, blog, category, tag, customer,
  custom-fields, storage (Google Cloud Storage), statistics, dev/ops
- **Client website API ready** — public-site endpoints out of the box
  (`client/blogs` list + detail by slug, error-report intake), guarded by a
  static `WEBSITE_AUTH_TOKEN` bearer key — plug a storefront or marketing
  site straight in
- **Tested where it matters** — unit tests with **Jest** (`ts-jest` +
  `@nestjs/testing`); specs pin the exception filter, throttle tracker,
  redaction, and the user-management/delete guards
- **Docker-ready** — multi-stage `Dockerfile` + `docker-compose.yml`

## Quick Start

### Option 1 — Docker (one command)

```bash
cd src/base-nestjs-backend
docker compose up
```

The API is up at `http://localhost:8080/api` with MongoDB included. Seed the
first admin account:

```bash
docker compose exec api node dist/seed.js
```

### Option 2 — Local Node

Prerequisites: Node.js 22+, MongoDB running locally.

```bash
cd src/base-nestjs-backend
npm install
cp .env.example .env
npm run start:dev
```

The API is up at `http://localhost:8080/api`. Outside production every setting
has a safe dev fallback, so a fresh clone runs with no configuration.

> **Google Cloud Storage is optional** — the app boots and runs without it;
> only the file-upload endpoints need it. See
> [Configuration](#configuration) when you get there.

## Starting your own product

Renaming is a **workspace-level** job, not a per-service one — the auth cookie
name has to change in this service *and* in the dashboard together, or login
silently stops working. The workspace root has both the checklist and a ticket
that executes it:

- [SETUP.md](../../SETUP.md) — every template default that must change
- [docs/tickets/G02](../../docs/tickets/G02-make-it-yours.md) — hand it to Claude
  Code and it does the above

## Configuration

Copy [`.env.example`](.env.example) to `.env` and fill it in. Defaults live in
[`configs/config.config.ts`](src/configs/config.config.ts).

**Four variables are required in production — the app throws at startup without
them**, deliberately, rather than booting into an insecure state:

| Variable | Why it fails fast |
|---|---|
| `JWT_SECRET` | Otherwise the app would sign tokens with a well-known dev fallback. Generate with `openssl rand -hex 32`. |
| `CORS_ORIGIN` | Browsers reject `Access-Control-Allow-Origin: *` together with credentials, so a missing list silently breaks dashboard login instead of erroring. |
| `SEED_ADMIN_EMAIL` | Otherwise the seeder creates a publicly documented account. |
| `SEED_ADMIN_PASSWORD` | As above. |

Also worth setting deliberately:

- **`TRUST_PROXY`** — the **number of proxies** in front of this service (`1` for
  Cloud Run on its own). A hop count, never `true`: `true` trusts every
  `X-Forwarded-For` entry, which lets any caller forge the address the rate
  limiter counts and mint themselves unlimited quota. Re-check it whenever a load
  balancer goes in front — then it is `2`. Defaults to `loopback` locally.
- **`FALLBACK_LANGUAGE`** — language for API messages when the request doesn't
  specify one (`en` by default; `vi` also ships). Add your own catalog under
  [`src/i18n/`](src/i18n/).
- **`WEBSITE_AUTH_TOKEN` / `INTERNAL_AUTH_TOKEN`** — static bearer tokens for the
  storefront and internal maintenance endpoints.
- **`SLACK_APP_TOKEN` / `SLACK_CHANNEL_ID`** — unset means error alerting is
  silently off (console only).

### Google Cloud Storage (only for file uploads)

Uploads need a service account. Point `GOOGLE_APPLICATION_CREDENTIALS` at your
local service-account JSON before starting, e.g.
`GOOGLE_APPLICATION_CREDENTIALS=~/path/to/sa.json npm run start:dev`.

The bucket must grant `allUsers` the `roles/storage.objectViewer` role under
**Uniform Bucket-Level Access**. Uploads deliberately set no per-object ACL —
`makePublic()` throws on a UBLA bucket.

## Seeding

Creates the first admin via
[`SeedAdminService`](src/modules/users/seeds/seed-admin.service.ts) and
[`src/seed.ts`](src/seed.ts):

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='<strong-password>' npm run seed
```

Outside production, both variables fall back to dev defaults so a fresh clone
works with no setup. Those defaults are **not** printed here on purpose — read
them from `seed-admin.service.ts` if you need them, and never rely on them
anywhere reachable from the internet.

The seeded account has role `SUPPER_ADMIN`, which is intentionally invisible to
the user-management API — see **Authorization** below.

## Available Scripts

- **Start** — `start`, `start:dev` (watch), `start:debug` (inspector),
  `start:prod` (from `dist`)
- **Seed** — `seed` (create the first admin)
- **Tests** — `test`, `test:watch`, `test:cov`, `test:e2e`
- **Quality** — `format` (Prettier write)

> ⚠️ **`npm run lint` is `eslint --fix`: it rewrites files across the whole
> repo**, not just the ones you changed, and the repo carries pre-existing
> findings so a red result tells you nothing about your change. Use it only when
> you mean to reformat. To check your own work:
>
> ```bash
> npx tsc --noEmit -p tsconfig.json   # types
> npx jest                            # tests
> npx eslint <your-files>             # lint, no --fix
> ```

All scripts are defined in [package.json](package.json).

A VS Code launch config exists at [.vscode/launch.json](.vscode/launch.json);
the preferred approach is a JavaScript Debug Terminal with `npm run start:debug`.

## Testing

Jest is configured in `package.json` (`rootDir: src`, `testRegex: .*\.spec\.ts$`),
with `moduleNameMapper` mapping the `src/…` absolute-import style this codebase
uses — **without that mapping any spec touching a runtime `src/…` import fails to
resolve**, so keep it.

```bash
npx jest                    # whole suite
npx jest src/shared         # one area
```

Current coverage is deliberately concentrated on the security-relevant paths —
the exception filter, the Slack sink, the throttle tracker, the user-management
guards, and the delete-in-use guards. When you add a guard, add its spec: several
of these tests exist specifically because the behaviour they pin was once wrong.

## Architecture Notes

Why the defaults are what they are — worth reading before you change them.

### Foundations

- **Config** — [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration),
  centralized in [`configs/config.config.ts`](src/configs/config.config.ts)
- **i18n** — `nestjs-i18n`, fallback `en` (override with `FALLBACK_LANGUAGE`),
  resolvers for query / `Accept-Language` / `x-lang`; translations under
  [`src/i18n`](src/i18n/en/admin.json). File watching is dev-only. Exceptions
  can pass `args` for placeholder interpolation:
  `new BadRequestException({ message: 'key', args: { count } })`.
- **MongoDB / Mongoose** — [`configs/mongoose.config.ts`](src/configs/mongoose.config.ts),
  base schema/repository in [`shared/base`](src/shared/base/base.repository.ts)
- **API prefix** — `/api` (see [`main.ts`](src/main.ts)); port `8080` by default

### Authentication

- **Admin** — Passport Local + JWT, httpOnly cookie or `Authorization: Bearer`.
  [`jwt.admin.strategy.ts`](src/modules/auth/strategies/jwt.admin.strategy.ts)
  re-reads the user from the database on **every** request, so a deleted or
  blocked admin loses access immediately instead of keeping a valid token until
  it expires.
- **Cookie** — `sameSite: 'lax'`, which keeps the browser's own CSRF protection
  on. That works when the dashboard and API are siblings under one registrable
  domain (`app.example.com` + `api.example.com`) and is also what keeps login
  working on Safari/iOS. A product that must go genuinely cross-domain has to
  change it in **both** `login` and `logout` in
  [`auth.admin.controller.ts`](src/modules/auth/controllers/auth.admin.controller.ts)
  and should keep [`JsonOnlyGuard`](src/shared/guards/json-only.guard.ts) on its
  writes.
- **Static-key callers** — [`key-auth.guard.ts`](src/modules/auth/guards/key-auth.guard.ts)
  is a factory shared by the client and internal guards; it compares tokens in
  constant time, so the comparison is not a timing oracle.
- **Secret strength** — generate every shared secret with `openssl rand -hex 32`.
  [`validate-secrets.ts`](src/shared/config/validate-secrets.ts) refuses to boot
  in production on a secret that is too short or shaped like a hand-written one.
  The guards fail closed on an *unset* var, so absence is already safe; the
  unguarded case is a value that is present but guessable, which nothing rejects
  at request time. Leave a var blank to disable that surface rather than filling
  in a placeholder. To rotate: set the new value, redeploy, then update callers.

### Authorization

[`RolesGuard`](src/modules/auth/guards/roles.guard.ts) +
[`@Roles()`](src/modules/auth/decorators/roles.decorator.ts). The role is read
from the database rather than the JWT payload, so a demotion takes effect at
once. Routes with no `@Roles()` are unaffected.

```ts
@UseGuards(JwtAuthAdminGuard, RolesGuard)
@Controller('admin/users')
export class UserAdminController {
  @Get()
  @Roles(UserRoleEnum.SUPPER_ADMIN, UserRoleEnum.ADMIN)
  getPaging() { /* … */ }
}
```

**`SUPPER_ADMIN` is the platform owner's account, not a tenant role**, and the
user-management API hides it completely: not listed (whatever `?role=` asks for),
not readable, not editable, not deletable, and its password cannot be reset from
there. That is a hard rule rather than a "don't leave zero super admins" count,
because otherwise any `ADMIN` could reset the owner's password and take the
account over. It reports `not_found` rather than "forbidden" — the account is
hidden, so from that API's point of view it does not exist.

Admins also cannot change **their own** role or status, or delete themselves —
each is a one-request lockout that only shows up on the next call.

### Rate limiting

Only the **DEFAULT** throttler is registered globally
([`throttler.config.ts`](src/configs/throttler.config.ts)). `STRICT`, `CLIENT`,
`ERROR_REPORT` and `ERROR_REPORT_ADMIN` in
[`throttler.constant.ts`](src/shared/constants/throttler.constant.ts) are
**override values**, applied per route against the default context:

```ts
@Throttle({
  [THROTTLER_CONFIGS.DEFAULT.NAME]: {
    ttl: THROTTLER_CONFIGS.STRICT.TTL,
    limit: THROTTLER_CONFIGS.STRICT.LIMIT,
  },
})
```

Registering them as separate *named* throttlers made every context apply to every
route at once, which is why they carry no `NAME`.

[`ThrottlerBehindProxyGuard`](src/shared/guards/throttler-behind-proxy.guard.ts)
keys on `req.ip` — resolved by Express through `trust proxy`, hence the
`TRUST_PROXY` hop count above. It never keys on a caller-supplied header, with
one deliberate exception: `X-Client-IP` is honoured **only** for a caller holding
`WEBSITE_AUTH_TOKEN`, so a storefront proxying requests can pass the real end
user's address through instead of every request sharing the website's egress
address.

### Error handling and alerting

[`AllExceptionsFilter`](src/shared/filters/all-exceptions.filter.ts) turns
exceptions into i18n-aware responses and decides what gets alerted.

- **Redaction** — credentials (`password`, `accessToken`, …) and personal data
  (`name`, `phoneNumber`, `address`, `email`, `note`) are stripped from the body
  at every depth, and `authorization` / `cookie` / `set-cookie` from the headers,
  *before* the payload reaches the logger. Without it a single 500 puts a working
  session cookie in the log sink.
- **429s are never alerted.** A rate-limited request is the limiter working;
  alerting on it means every request past the limit posts to Slack, so tripping
  the brake buries alerts more effectively than evading it. Throttle events go to
  stdout as one greppable `[throttled]` line, path only — never the query string.
- **Validation errors** are forwarded as `errors: string[]`, so a 400 tells the
  caller which field failed instead of "Bad Request Exception".

At the sink, [`slack-escape.util.ts`](src/shared/utils/slack-escape.util.ts)
escapes Slack's mrkdwn control sequences (so reported text cannot ping the
workspace or disguise a link), redacts phone-shaped strings that field-level
redaction cannot see because no key names them, and caps length. Alerts are
tagged with `K_SERVICE` so one channel serving several services stays traceable,
and link/media unfurling is off so an attacker-supplied URL in a stack trace is
never fetched into the channel.

The `dev` module holds the operator surface — a deploy checklist
(`GET dev/checklist`, behind `DevSecretGuard`) and error-report intake for
browser-facing surfaces. Its three controllers are authenticated three different
ways (ops secret, website token, admin JWT), which is why they are separate
classes, but they share one `ErrorReportService` so the dedupe window and flood
gate are global rather than one budget each.

### Referential integrity

Deleting a record that something still points at is refused with a count rather
than silently orphaning rows — see `remove()` in
[`tag.admin.service.ts`](src/modules/tag/services/tag.admin.service.ts) and
[`category.admin.service.ts`](src/modules/category/services/category.admin.service.ts).
The referring schema is registered read-only in the guarding module, rather than
importing the owning module, so the dependency stays one-directional.

**Products built on this base must extend these guards.** A project that adds a
module referencing tags or categories has to count its own collection too, or
the guard silently under-reports.

### Scheduling the orphaned-file sweep

`POST /api/internal/storage/cleanup` permanently deletes uploads whose
back-link is still `null` after 7 days — the safety net for files that were
uploaded but never attached to an entity. **Nothing schedules it; wire it to a
scheduler as part of every deployment.** It authenticates with
`Authorization: Bearer $INTERNAL_AUTH_TOKEN`.

Cloud Scheduler (pairs with the Cloud Run deployment):

```bash
gcloud scheduler jobs create http storage-cleanup \
  --schedule="0 4 * * *" \
  --time-zone="Etc/UTC" \
  --http-method=POST \
  --uri="https://<your-api-host>/api/internal/storage/cleanup" \
  --headers="Authorization=Bearer ${INTERNAL_AUTH_TOKEN}"
```

Or plain cron on any box that can reach the API:

```cron
0 4 * * * curl -fsS -X POST -H "Authorization: Bearer $INTERNAL_AUTH_TOKEN" https://<your-api-host>/api/internal/storage/cleanup
```

Either way the token ends up stored in the scheduler's config — acceptable for
an internal maintenance token, but scope who can read that config accordingly.

### Gotchas worth knowing

- **`@Prop({ type: Types.ObjectId })` can yield a `Mixed` path with no query
  casting**, so string ids never match. Use
  `mongoose.Schema.Types.ObjectId` for scalar refs. The array form
  (`type: [{ type: Types.ObjectId, ref: 'X' }]`) is left as-is deliberately —
  it is in use and working.
- **`password` has `select: false`.** Reading it needs an explicit
  `{ select: '+password' }`, or `bcrypt.compareSync(old, undefined)` throws a 500.

## Project Structure

```
.env.example
.prettierrc
Dockerfile
docker-compose.yml
eslint.config.mjs
nest-cli.json
package.json
tsconfig.json
src/
  configs/            config, i18n, mongoose, throttler
  i18n/
    en/               admin.json, common_error.json, website.json
    vi/               admin.json, common_error.json, website.json
  modules/
    auth/             controllers, decorators (roles), guards
                      (jwt, local, key-auth factory, roles), strategies
    blog/             controllers (admin + client), dto, enums, schemas, services
    category/         + delete-in-use guard spec
    custom-fields/    definitions + values
    customer/
    dev/              deploy checklist, error-report intake
    statistic/
    storage/          GCS service, file metadata, internal cleanup
    tag/              + delete-in-use guard spec
    users/            + role/self-write guard spec
  shared/
    base/             base.repository.ts, base.schema.ts
    constants/        constant.ts (getJwtSecret), throttler.constant.ts
    decorators/       transform-object-id, user
    dto/              common-paginate
    filters/          all-exceptions.filter (+ spec)
    guards/           json-only, throttler-behind-proxy (+ specs)
    services/         logger (+ spec), slack
    utils/            phone, regex, slack-escape (+ specs)
  app.module.ts
  main.ts
  seed.ts
```

Run `git ls-files src` for the authoritative listing — the tree above is a map,
not an inventory.

## Support

If you find this project helpful, please consider giving it a ⭐ on GitHub.
Your support helps us continue developing and maintaining this template.

## License

MIT — see [LICENSE](LICENSE). Free to use, modify, and distribute;
just keep the copyright notice.
