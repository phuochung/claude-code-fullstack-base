# R00 — <short title>

**Status:** open · in progress · done
**Surfaces:** backend · dashboard
**Depends on:** — (ticket ids, or none)

## Problem

What is wrong or missing, and how it shows up. Link evidence rather than
re-summarising it — a review, an error report, `file:line` references.

## Scope

What this ticket changes. Be specific enough that an agent reading only this file
knows where to work.

**Out of scope:** what a reasonable reader might otherwise fold in. Say it
explicitly; this is the line that keeps the diff reviewable.

## Approach

Optional. Fill in when the *how* is a decision rather than an implementation
detail — a choice between two designs, a migration ordering, a constraint that
rules out the obvious approach. Skip it when the work is mechanical.

## Surfaces affected

Per the checklist in the root `CLAUDE.md`. Delete rows that don't apply.

- **Backend** — field, default, `client/*` query behaviour. Should existing
  documents need a migration? Prefer defaults and predicates that make a missing
  field read as the safe legacy value.
- **Dashboard (editor)** — how an admin sets it.
- **Dashboard (read views)** — every table and detail page where the resulting
  state appears, including derived state.

## Done when

Checkable statements, not intentions:

- [ ] `npx tsc --noEmit` clean in every touched repo
- [ ] `npm test` passes (backend), `npm run build` passes (dashboard)
- [ ] <the observable behaviour, stated so someone else could confirm it>

## Result

Filled in when the work lands.

- **Changed:** files and what each change does.
- **Verified:** the commands actually run, and their outcome. Not "should work".
- **Left out:** anything in scope that was deliberately skipped, and why.
- **Follow-ups:** new tickets this surfaced.
