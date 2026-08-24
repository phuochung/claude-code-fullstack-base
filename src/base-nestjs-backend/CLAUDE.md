# Backend

- Runtime: Node.js (>= 22)
- Framework: NestJS 11
- Language: TypeScript (CommonJS)
- Database: MongoDB via Mongoose 8 (+ `mongoose-paginate-v2`)
- API runs on: `PORT` → `APP_PORT` → 8080 (in that precedence — Cloud Run sets `PORT`)
- API prefix: `/api`
- Auth: JWT + Local via Passport; httpOnly cookies; bcrypt (10 rounds)
- Storage: Google Cloud Storage (`@google-cloud/storage`)
- Validation: `class-validator` + `class-transformer`, global `ValidationPipe`
- i18n: `nestjs-i18n`, namespaces `admin` / `website` / `common_error`, bundled `en` + `vi`

## Module layout — the convention every module follows

```
modules/{module}/
├── {module}.module.ts
├── {module}.repository.ts
├── controllers/{module}.admin.controller.ts
│                {module}.client.controller.ts
├── services/{module}.admin.service.ts
│             {module}.client.service.ts
├── schemas/{module}.schema.ts
├── dto/{create,update,query}-{module}.dto.ts
│       {module}-response.dto.ts
└── enums/
```

Rules that hold this together:

- **Controllers and services always live in subfolders**, never at the module root. `blog/` is the reference implementation — copy its shape.
- **`.admin.` and `.client.` are separate files, not branches inside one file.** They have different guards, different response shapes (admin gets full metadata, client gets only what a public surface may see) and different rate limits. Merging them is how a client endpoint quietly inherits admin data.
- Modules present: `auth`, `users`, `blog`, `category`, `tag`, `customer`, `custom-fields`, `statistic`, `storage`, `dev`.
- `dev/` is operator plumbing, not a product feature — see below.

## Everything soft-deletes and carries an audit trail

`shared/base/base.schema.ts` is extended by every entity schema and supplies `deleted`, `createdBy`, `deletedBy`, `deletedAt`, plus `timestamps: true` for `createdAt`/`updatedAt`. It also registers the pagination plugin, which is why every list endpoint can paginate without per-schema setup.

**Queries must exclude soft-deleted rows themselves** — there is no global filter hook doing it for you. `shared/base/base.repository.ts` is where shared query behaviour belongs; prefer extending it over hand-writing Mongoose calls in a service.

## Startup fails fast rather than running misconfigured

Three checks in `main.ts` + `shared/config/validate-secrets.ts`, all production-only so local dev stays friction-free:

1. **`validateSecretStrength()` runs before anything binds a port.** The static-key guards fail closed when their env var is *unset* (that surface refuses every request), so an absent token is safe and deliberately not an error. A token that is *present but guessable* is the dangerous case — nothing rejects it at request time, so startup is the only place it can be caught. It rejects anything under 32 chars or matching a hand-written shape (`your-`, `changeme`, `secret-key`, `@20xx`, `.internal@`).
2. **`CORS_ORIGIN` must be an explicit list in production.** Browsers reject `Access-Control-Allow-Origin: *` together with credentials, so an unset value would silently break the dashboard's cookie auth. Throwing beats debugging that.
3. **`JWT_SECRET` throws in production**, and falls back to a well-known dev value locally.

Generate secrets with `openssl rand -hex 32`. Never hand-write one.

## `TRUST_PROXY` is a hop count, never `true`

`ThrottlerBehindProxyGuard` is the global `APP_GUARD` and keys on `req.ip`, which Express resolves through the `trust proxy` setting. Setting `true` trusts *every* `X-Forwarded-For` entry — and because platforms like Cloud Run **append** the address they observed, the leftmost entry is caller-supplied. A bot could rotate fake values and mint itself unlimited quota, defeating the 10/min brute-force limit on auth routes.

`1` is correct for Cloud Run on its own. **Re-check it when a load balancer goes in front** — it becomes `2`, and a stale count keys every client on the LB's address, i.e. one shared bucket for the whole internet. Unset defaults to `'loopback'` for local dev.

## Rate limits: only DEFAULT is global

`shared/constants/throttler.constant.ts`. `DEFAULT` (500/min) is registered globally; `STRICT` (10/min, auth routes), `CLIENT` (200/min, higher because SSR fires several parallel requests per page load from one address), `ERROR_REPORT` (10/min) and `ERROR_REPORT_ADMIN` (20/min) are **per-route `@Throttle()` overrides, deliberately not registered as named throttlers** — registering them would apply every context to every route.

Throttle **per method, not per controller**, whenever two routes on one controller have different abuse profiles. A write and a read sharing a bucket means a burst of one locks callers out of the other.

## Static-key guards use constant-time comparison

`modules/auth/guards/key-auth.guard.ts` is a factory (`KeyAuthGuard(envVarName)`) shared by the client and internal guards — they differ only in which env var holds the expected token. It compares with `crypto.timingSafeEqual` after a length check, so the comparison leaks neither length nor content by timing. Don't reimplement a `===` version.

## Error alerting: escape at the sink, never trust the source

`LoggerService` → `SlackService` is the alert pipeline, and `DevModule` also accepts errors reported by the frontends (`POST /api/client/errors`, `POST /api/admin/errors`). Anything reaching those endpoints is arbitrary caller text that ends up rendered in a Slack channel.

- **`shared/utils/slack-escape.util.ts` is the sink.** It neutralises `&`, `<`, `>` — which is what makes `<!channel>`, `<@user>` and `<https://evil|innocent>` inert — and turns ` ``` ` into `'''` so reported text cannot close a code fence and re-enter mrkdwn. `SlackService` also sets `unfurl_links: false` / `unfurl_media: false` and never `link_names`.
- **The console copy stays raw.** Cloud Logging is not a mrkdwn context, and escaping it would corrupt the record error-grouping relies on. Only the Slack copy is escaped.
- **Redaction is by field name, not regex.** `SENSITIVE_BODY_FIELDS` in `AllExceptionsFilter` covers `name` / `phone` / `address` / `email` / `note` / `contact`, because a 500 on a customer write puts the whole request body in the alert and names and addresses cannot be pattern-matched. Regression tests are in `all-exceptions.filter.spec.ts` — keep them passing.
- **A 429 must never page Slack.** `AllExceptionsFilter` deliberately does not alert on `ThrottlerException`: alerting on the rate limiter's own output means tripping the brake floods the channel harder than evading it. Throttle events go to stdout only.
- **Three brakes, not equivalent.** Per-IP `@Throttle` rejects at the guard, before the controller. Fingerprint dedupe (one error, many users) and `ErrorReportFloodGate` (many *different* errors at once — a botnet burying a real alert) run inside `ErrorReportService`. Only the flood gate survives an attacker spread across addresses.
- **The DTO is an allow-list** (`forbidNonWhitelisted`): no field exists for request bodies, headers or cookies. Adding one is how the guarantee above is lost.

## `dev/` module — two differently authenticated controllers

`DevModule` is registered **unconditionally**, so its endpoints exist in production. That is why `DEV_API_SECRET_KEY` is in the strength-validated set — treat it as a production secret.

`DevController` (`/api/dev/*`, behind `DevSecretGuard`) and the error-report controllers (`/api/client/errors` behind `KeyAuthClientGuard`, `/api/admin/errors` behind the admin JWT guard) cannot be one controller: different prefix, different guard.

## File storage: reference by id, never embed

Uploads are standalone `FileMetadata` documents (`POST /admin/storage/image/upload`, bytes in GCS). Owning entities store the metadata **id**, and `FileMetadata` carries a **back-link** to its owner (`FileMetadata.blog`).

`POST /internal/storage/cleanup` (`storage.internal.service.ts`) permanently deletes files that are orphaned — back-link `null` and older than 7 days. It is the safety net for uploads that were never attached to an entity. **Nothing schedules it; it must be called.**

Do not embed `FileMetadata` subdocuments in entities — always ref + back-link, so the cleanup sweep can find what nothing owns.

> If your product needs an image to be deleted the moment an entity stops using it (rather than swept up 7 days later), that is a release-inside-the-transaction / purge-after-commit pattern. Purging inside the transaction is wrong: GCS deletes cannot be rolled back, so an abort after purging leaves an entity pointing at bytes that are gone.

## GCS credentials are not in `.env`

`GcsService` calls `new Storage()` with no arguments, so it uses Application Default Credentials: on Cloud Run that resolves via the attached service account with nothing to configure, and locally you point `GOOGLE_APPLICATION_CREDENTIALS` at a key file.

## i18n: exceptions throw keys, the filter translates

Throw `new BadRequestException('admin.tag.not_found')` — a **key**, not a sentence. `AllExceptionsFilter` resolves it against the caller's locale. For counts, throw `{ message: key, args: { count } }`; the filter passes `args` to the translator and **strips it from the response**, since it is a server-side translation input and not part of the API contract.

Fallback locale is `FALLBACK_LANGUAGE`, defaulting to `COMMON_CONSTANTS.LANG` (`'en'`). Resolution order is `?lang=` → `Accept-Language` → `x-lang`.

**Both locale files must define every key a `throw` can reach.** A missing key surfaces to the caller as the literal key string.

## Key env vars

```
APP_PORT=8080
NODE_ENV=local              # 'production' enables every fail-fast check
MONGODB_URI=mongodb://127.0.0.1:27017/projectName-dev
CORS_ORIGIN=                # explicit list; REQUIRED in production
FALLBACK_LANGUAGE=en
GCP_STORAGE_BUCKET_NAME=
GCP_STORAGE_PUBLIC_URL=https://storage.googleapis.com
JWT_SECRET=                 # required in production
WEBSITE_AUTH_TOKEN=         # leave blank to disable that surface (fails closed)
INTERNAL_AUTH_TOKEN=
SLACK_CHANNEL_ID=
SLACK_APP_TOKEN=
DEV_API_SECRET_KEY=         # production secret — DevModule is always registered
SEED_ADMIN_EMAIL=           # npm run seed; required in production
SEED_ADMIN_PASSWORD=
TRUST_PROXY=1               # HOP COUNT, never `true`
THROTTLE_DEFAULT_TTL=60000
THROTTLE_DEFAULT_LIMIT=500
```

See [.env.example](.env.example) — it documents the *why* for each, not just the name.

## Scripts

```
npm run start:dev    # watch mode
npm run start:prod   # node dist/main
npm run build        # nest build
npm run seed         # create the seed admin
npm test             # Jest (11 suites, 123 tests)
npm run lint         # eslint --fix
```

`npx tsc --noEmit` and `npm test` both pass clean — keep them that way. Tests are colocated as `*.spec.ts` next to the unit under test, not in a parallel tree.
