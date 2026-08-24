# G01 — Get it running locally

**Status:** open
**Surfaces:** backend · dashboard
**Depends on:** —

> Starter ticket. Hand this to Claude Code as your first instruction:
> *"Read docs/tickets/G01 and do it."*

## Goal

A working local install: both dev servers up, and a successful sign-in to the
dashboard with the seeded admin. No product renaming yet — that is [G02](G02-make-it-yours.md).

## Prerequisites — check, don't assume

- **Node 22+** — `node -v`. If lower, stop and tell the user; nvm or a system
  upgrade is their call.
- **MongoDB reachable on `localhost:27017`** — `nc -z localhost 27017` or
  `mongosh --eval 'db.runCommand({ping:1})'`.

If Mongo is not running, offer these and let the user pick — **do not install
system software without asking**:

```bash
# Docker (no host install; this is the one that keeps hot-reload working)
docker run -d --name base-mongo -p 27017:27017 -v base-mongo-data:/data/db mongo:7

# or macOS with Homebrew
brew services start mongodb-community
```

Note `src/base-nestjs-backend/docker-compose.yml` also brings up API + Mongo
together, but it deliberately does **not** publish Mongo's port to the host, so
it is a "see it working" path rather than a development path. Prefer a
host-reachable Mongo plus `npm run start:dev`, so backend changes hot-reload.

## Steps

### 1. Backend

```bash
cd src/base-nestjs-backend
cp .env.example .env
npm install
```

Then fill in `.env`. Generate **each** secret separately — never reuse one value
across two variables, and never hand-write them (the backend rejects guessable
values at boot in production, and you want local to match):

```bash
openssl rand -hex 32   # once per secret
```

Set `JWT_SECRET`, `WEBSITE_AUTH_TOKEN`, `INTERNAL_AUTH_TOKEN`,
`DEV_API_SECRET_KEY`. Leave a token blank only if you want that surface disabled
— the guards fail closed, so blank refuses every request.

`.env` is gitignored. Do not print the generated values into the chat beyond
what is needed to confirm the step, and do not commit anything.

```bash
npm run seed        # creates the first admin
npm run start:dev   # → http://localhost:8080/api
```

The seeder uses `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` if set. Unset locally,
it falls back to **`you@example.com` / `12345678`** — dev-only, and it throws
rather than seeding a known account when `NODE_ENV=production`.

### 2. Dashboard

```bash
cd ../base-nextjs-dashboard
cp .env.example .env.local
npm install
npm run dev         # → http://localhost:3001
```

### 3. Confirm

Open `http://localhost:3001`, get redirected to `/signin`, and sign in with the
seeded admin. You should land on the dashboard with the sidebar populated.

## Done when

- [ ] `mongosh --eval 'db.runCommand({ping:1})'` succeeds
- [ ] Backend responds: `curl -s -o /dev/null -w '%{http_code}' localhost:8080/api` returns a status (not a connection refusal)
- [ ] `npm run seed` logs the admin as created (or already existing)
- [ ] Dashboard loads at `:3001` and an unauthenticated visit redirects to `/signin`
- [ ] Sign-in with the seeded admin reaches the dashboard
- [ ] `npx tsc --noEmit` clean in both services; `npm test` passes in the backend

## If something fails

- **Dashboard loads but every request 401s** → `AUTH_COOKIE_NAME` in the
  dashboard must equal the backend's `COMMON_CONSTANTS.COOKIE_NAME`. Both are
  `auth_token` out of the box, so this only bites after G02.
- **CORS error in the browser console** → `CORS_ORIGIN` in the backend `.env`
  must list `http://localhost:3001`.
- **Backend exits at startup complaining about a secret** → that check is
  production-only; confirm `NODE_ENV` is not `production` in your `.env`.

## Result

Record what you did: the Mongo route chosen, which secrets were generated, the
seeded admin email, and the output of each Done-when check. If you skipped
anything, say so explicitly.

## Next

[G02 — Make it yours](G02-make-it-yours.md) before writing any feature code.
