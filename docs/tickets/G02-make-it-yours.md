# G02 — Make it yours

**Status:** open
**Surfaces:** backend · dashboard
**Depends on:** [G01](G01-get-it-running.md)

> Hand to Claude Code as: *"Read docs/tickets/G02 and do it. My product is called
> <name>."*

## Goal

Replace every template default that would cause a real problem if it shipped.
[SETUP.md](../../SETUP.md) is the authoritative list — this ticket is the
instruction to execute it, not a second copy of it.

**Ask the user for the product name first** if it was not given. You need a short
lowercase slug (e.g. `acme`) and a display name (e.g. `Acme`). Do not invent them.

## Scope

Work through SETUP.md sections 1–5 in order. The one that matters most is §1:

- **The auth cookie name.** `COOKIE_NAME` in the backend and `AUTH_COOKIE_NAME`
  in the dashboard must be changed **together** to `auth_token_<slug>`. They are
  matched only by convention, so if they drift, login appears to succeed and
  every subsequent request is anonymous. Two products under one parent domain
  sharing a cookie name overwrite each other's sessions.

Then §4 (package names, DB name, bucket name, cloudbuild tag, LICENSE
copyright), §5 (wordmark, metadata titles, favicon, brand colour), and §3 if the
team reads logs in a non-UTC timezone.

**Out of scope:** renaming the `src/base-*` directories (offer it, don't assume
it — it touches `base.code-workspace`, `.vscode/tasks.json`, the root CLAUDE.md
table and SETUP.md's own paths). Also out of scope: deployment config (§6) and
any feature work.

## Approach notes

- **Do not blind find-and-replace `base`.** It appears in `--font-*` tokens,
  `--breakpoint-*` names, npm package names of real dependencies, and the word
  "database". Change the specific values SETUP.md lists.
- The two logo files duplicate the SVG on purpose — they wrap it differently.
  Change both.
- If the user has no logo yet, leave the mark and change only the wordmark text;
  say so rather than inventing a design.

## Done when

- [ ] `grep -rn "auth_token" src/*/src` shows the new name in both services and nowhere stale
- [ ] Backend and dashboard both still start, and sign-in still works (the cookie name changed on both sides, so a stale browser cookie may need clearing)
- [ ] `npx tsc --noEmit` clean in both; `npm test` passes in the backend; `npm run build` passes in the dashboard
- [ ] No occurrence of `projectName` remains in your `.env` files
- [ ] The dashboard tab title and sidebar wordmark show the product name

## Result

List each value changed, old → new, and the verification output. Note anything in
SETUP.md you deliberately skipped.

## Next

[G03 — Your first module](G03-first-module.md).
