# G03 — Your first module, end to end

**Status:** open
**Surfaces:** backend · dashboard
**Depends on:** [G02](G02-make-it-yours.md)

> Hand to Claude Code as: *"Read docs/tickets/G03 and add a `<thing>` module."*
> Replace `<thing>` with whatever your product actually manages — `product`,
> `venue`, `invoice`.

## Goal

One new entity, working end to end: schema → API → dashboard list, detail,
create and edit. This is the ticket that turns the template into your product,
and it is also the fastest way to learn the conventions, because the whole
pattern already exists twice.

**Ask what the entity is and what fields it has** if not specified. Do not invent
a domain model.

## Scope

### Backend — copy the shape, don't improvise

`src/base-nestjs-backend/src/modules/blog/` is the reference implementation.
Mirror it exactly:

```
modules/<thing>/
├── <thing>.module.ts
├── <thing>.repository.ts
├── controllers/<thing>.admin.controller.ts
│                <thing>.client.controller.ts   ← only if a public surface needs it
├── services/<thing>.admin.service.ts
│             <thing>.client.service.ts
├── schemas/<thing>.schema.ts
├── dto/{create,update,query}-<thing>.dto.ts
│       <thing>-response.dto.ts
└── enums/
```

Non-negotiables, all explained in the [backend CLAUDE.md](../../src/base-nestjs-backend/CLAUDE.md):

- Extend the shared base schema so the entity gets `deleted`, `createdBy`,
  `deletedBy`, `deletedAt` and timestamps. **Queries must exclude soft-deleted
  rows themselves** — nothing does it globally.
- Controllers and services in subfolders, never at the module root.
- `.admin.` and `.client.` stay separate files. Different guards, different
  response shapes, different rate limits — merging them is how a public endpoint
  inherits admin data.
- Throw i18n **keys**, not sentences: `throw new BadRequestException('admin.<thing>.not_found')`.
  Then add that key to **both** `src/i18n/en/admin.json` and `src/i18n/vi/admin.json`
  — a missing key reaches the caller as the literal key string.
- Register the module in `app.module.ts`.

### Dashboard

`src/app/(admin)/(others-pages)/blogs/` is the reference. You need:

- `src/api/services/<thing>.ts` — one service file. Never `fetch` from a
  component.
- List page using `useListPage` + `useSearchKeyword` + `ResponsiveTable`, with a
  `mobile` role on every column.
- Create / edit / detail pages.
- Locale keys in **both** `src/locales/en.json` and `src/locales/vi.json`,
  including a `<thing>.table.empty`. `t()` renders the raw key when it cannot
  resolve, so audit before you finish.
- Sidebar entry in `src/layout/AppSidebar.tsx`.

**Out of scope:** file uploads (add later by following how blog references
`FileMetadata` by id with a back-link), and any public website surface.

## Cross-surface check

Before finishing, re-read the checklist in the [root CLAUDE.md](../../CLAUDE.md).
If this entity has a status or visibility concept, enumerate **every** view that
displays it — the editor *and* every read view — not just the one you were
looking at.

## Done when

- [ ] `npx tsc --noEmit` clean in both services
- [ ] `npm test` passes in the backend; add a spec for any non-trivial service logic
- [ ] `npm run build` passes in the dashboard
- [ ] Every `t()` key the new pages call resolves in **both** locale files
- [ ] Manually: create a record, see it in the list, edit it, soft-delete it, and confirm it disappears from the list but survives in the database

## Result

Files added, keys added, commands run with their output, and anything left out.

## Next

Nothing prescribed — you have the pattern. [G04](G04-add-a-service.md) if you
need a second frontend.
