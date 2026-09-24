---
status: todo
pri: P2
size: S
updated: YYYY-MM-DD
blocked_on: ""
---

# R00 — <outcome, not activity>

| | |
|---|---|
| **Status** | todo — <on every change: date, what is verified, what is still owed> |
| **Priority** | P0–P3 — <why> |
| **Size** | XS–L — <what drives it> |
| **Surfaces** | backend · dashboard |
| **Depends on** | — (ticket ids, or none) |
| **Blocks** | — |
| **Backlog ref** | — (the BACKLOG.md item, or "direct request") |
| **Design doc** | — (`docs/plans/…` when one exists) |
| **Owner input** | none (who decided what, when) |

The frontmatter is the record of state: `todo → in_progress → review → implemented →
done`, or `blocked` / `descoped`. **`implemented` is not `done`** — code complete and
verify green, but a human check is still owed; name it in `blocked_on`. Set `updated`
on every change. The Status row above carries the evidence in words.

## Problem

What is wrong or missing, and how it shows up. Link evidence rather than
re-summarising it — a review, an error report, `file:line` references.

## Scope

What this ticket changes. Numbered steps, each with the reasoning behind the
decision, specific enough that an agent reading only this file knows where to
work and why.

**Out of scope:** what a reasonable reader might otherwise fold in, **with the
reason** it was left out. Say it explicitly; this is the line that keeps the diff
reviewable and stops the idea being re-proposed from older text.

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

- [ ] `npx tsc --noEmit` clean in every touched service
- [ ] `npm test` passes (backend), `npm run build` passes (dashboard)
- [ ] <the observable behaviour, stated so someone else could confirm it>

## Result

Filled in by the developer when the work lands.

- **Changed:** files and what each change does.
- **Verified:** the commands actually run, and their outcome. Not "should work".
- **Left out:** anything in scope that was deliberately skipped, and why.
- **Follow-ups:** new tickets this surfaced.

## Review

Filled in by the reviewer, in fresh context.

- **Verdict:** APPROVE · CHANGES_REQUIRED — date
- **Blocking:** `path:line` — what, why. Only correctness, security, or a stated
  criterion counts as blocking.
- **Non-blocking:** optional notes; the Leader may skip them.
- **Verified by:** the commands run and their outcome.
