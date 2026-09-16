## Context

The course overview already reads three device stores once, in `CourseProgressBoard`, and derives every
tile from a single `courseOverviewProgress` reading — its own documentation says this is so no two tiles
can disagree. The prizes are a fourth fact about the same device, kept by `useClaimedPrizes` as a set of
module slugs, and mapped to a toy by `prizeForModule`. `PrizeIcon` already draws every toy in two
states, coloured and silhouette.

So nothing has to be invented or fetched. The design questions are where the prize sits, what makes it
coloured, and how it says what it means to someone who cannot see it.

## Goals / Non-Goals

**Goals:**

- Show what each lesson is worth, where the learner decides what to watch next.
- One definition of "claimed", shared with the counter.
- The prize never contradicts the counter, and never spoils it.

**Non-Goals:**

- Claiming, revealing or counting tickets on this page (see the proposal's non-goals).
- Any change to the rings, chips, tallies, continue tile or module route.

## Decisions

### D1 — Coloured means claimed, not complete

The toy is coloured only for a module whose prize the learner has **claimed** on the counter; every other
module shows the silhouette. Completing a module makes its prize *ready*, not obtained, and
`learner-achievements` keeps a ready prize hidden — `???`, silhouette — until the learner claims it, so
colouring it here would spend the reveal a screen early.

- *Alternative:* colour at 100 % completion, which is what a first sketch of this page did. Rejected: it
  contradicts a standing requirement and makes the counter's claim moment pointless.

### D2 — The board reads the claims once and hands each tile its prize

`CourseProgressBoard` calls `useClaimedPrizes` beside the readings it already takes, and passes each tile
a small value — the prize id and whether it is claimed. The tiles stay presentational and cannot disagree
with each other or with the tally.

- *Alternative:* each tile reads the store itself. Rejected: it multiplies subscriptions and breaks the
  board's existing "one reading" rule.

### D3 — The prize rides the artwork band, not the body

On a lesson tile the toy sits at the top-right of the artwork band, where the ordinal already anchors the
opposite corner. The body below is a fixed vertical rhythm — chip, title, meta — that a fourth element
would stretch, and the band is decorative space the ring already overlaps.

### D4 — The tally reuses the counter's arithmetic

"N of M prizes" counts claimed prizes over modules that hold lessons — the same definition
`learnerAchievements` uses for `prizesRedeemed` and `prizeCount`, applied to this course. A module with
no lessons has nothing to redeem and is not counted, on either page.

### D5 — The illustration is decoration; the words carry the state

The toys are `aria-hidden`, as they are on the counter. The tally is a real sentence, and each lesson
tile's accessible name already names the lesson; the prize adds no new control and no new tab stop, so a
tile that gains a prize does not gain a target.

### D6 — Before the claims are read, nothing is claimed

The claims store answers after hydration, like the others. Until it does, prizes render as silhouettes —
the state that asserts nothing — consistent with the page's existing rule that the server render claims
no progress.

## Risks / Trade-offs

- **The page gains a fourth device read** → it is the same shape as the three it already performs, taken
  once in the island that already owns them.
- **Ten toys on a five-column grid could read as clutter** → they are small, cornered, and silhouetted
  until claimed, so an unclaimed course shows a quiet repeated shape rather than ten gold objects.
- **A module slug the prize catalogue does not know** → `prizeForModule` already answers with the gift
  box, so a new or renamed module still shows something.

## Migration Plan

None. This is additive UI over an existing device store; reverting removes the badge and the tally.

## Testing strategy

- **Vitest + RTL — `lesson-ring-tile.test.tsx`**: the tile draws its module's prize as a silhouette, and
  coloured once claimed; the illustration is hidden from assistive technology and adds no control.
- **Vitest + RTL — `course-progress-tile.test.tsx`**: the tally states claimed over total prizes, counts
  only modules that hold lessons, and renders nothing about prizes before the reading arrives.
- **Vitest + RTL — `course-progress-board.test.tsx`**: the board reads the claims once and the tally and
  the tiles agree — claiming a module's prize colours that tile and moves the tally together.
- **Playwright e2e — `e2e/course-overview.spec.ts`**: with a prize claimed on the device, the course
  overview shows it claimed; the page still does not scroll sideways at 390px with prizes present.
- **Stories**: `lesson-ring-tile.stories.tsx` and `course-progress-tile.stories.tsx` gain a claimed and an
  unclaimed state.
- **Localization**: the tally's sentence in `en`/`es`/`pt`, guarded by the existing key-parity test.

## Open Questions

- Whether the course progress tile should also name the next prize within reach ("2 tickets to the
  harmonica"). Out of scope here: that is a ticket reading, and this change deliberately keeps ticket
  counts on the counter.
