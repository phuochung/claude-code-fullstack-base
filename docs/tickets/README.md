# Tickets

A ticket is **one scoped unit of work, handed to one agent (or one person), that
can be verified on its own.** This directory is the convention; the template is
[TEMPLATE.md](TEMPLATE.md).

The point is not process for its own sake. It is that a written ticket forces the
two things a vague prompt leaves out: what "done" means, and which surfaces are
affected. Both are what make an agent's output reviewable.

## Two series

**`G##` — getting started.** Shipped with the template. Hand them to Claude Code
in order and you go from a fresh clone to your own domain running on your own
branding. Read-only reference: don't renumber them, and there is no need to
delete them once done — mark the Status and move on.

| | |
|---|---|
| [G01](G01-get-it-running.md) | Get it running locally |
| [G02](G02-make-it-yours.md) | Make it yours — execute [SETUP.md](../../SETUP.md) |
| [G03](G03-first-module.md) | Your first module, end to end |
| [G04](G04-add-a-service.md) | Add another service under `src/` |

**`R##` — your work.** Start at `R01`. Separate prefixes so the starter set never
collides with your numbering, and so `R07` means one thing in your history
forever.

## How it works

1. **Capture** loose ideas in [BACKLOG.md](../../BACKLOG.md). No format, no
   commitment — just somewhere nothing gets lost.
2. **Groom** an item into a ticket here when you're ready to act on it. Copy
   `TEMPLATE.md` to `R<nn>-<short-slug>.md`.
3. **Build** one ticket at a time. The ticket is the agent's brief; it should not
   need the conversation that produced it.
4. **Record** the outcome in the ticket's own Result section — what changed, what
   was verified, what was deliberately left. The ticket becomes the artifact.

Numbering is sequential and never reused, so `R12` means one thing forever, in
commit messages and in code comments alike.

## What makes a ticket good here

- **Name the surfaces.** This is a multi-service workspace; the most common
  failure is changing the backend and forgetting the read view that displays it.
  The root [CLAUDE.md](../../CLAUDE.md) has the checklist.
- **State the verification, not just the goal.** "Add the field" is not
  checkable. "`npm test` passes and the list view shows the derived state" is.
- **Say what's out of scope.** An agent will otherwise reasonably widen the work.
- **Link the evidence.** If a review or a bug report produced this ticket, link
  it rather than re-summarising — `file:line` references age better than prose.

## Conventions

- One ticket per file, `R<nn>-<slug>.md` (or `G<nn>-` for the shipped starter set).
- State lives in the ticket's frontmatter (`status` / `pri` / `size` / `updated` /
  `blocked_on`): `todo → in_progress → review → implemented → done`, or `blocked` /
  `descoped`. `implemented` means code complete and verify green with a human check
  still owed. A board table, if you keep one, is a view of the frontmatter — never
  the other way round.
- A ticket that grows past one reviewable diff should be split, not stretched.
- Commits are made by hand. A ticket's Result records what was staged; it does
  not commit anything itself.
