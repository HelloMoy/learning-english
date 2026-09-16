## Why

The course overview is where a learner sees a course as a whole — every lesson as a ring tile, and the
course's progress beside them. It is the one progress surface that says nothing about the prizes those
lessons redeem, so the reward the tickets are for is invisible exactly where the learner is deciding
what to watch next. The Achievements page holds the whole counter; the course overview should show what
each lesson is worth without becoming a second counter.

## What Changes

- Each lesson tile carries **its module's prize** on the artwork band: the coloured illustration once the
  prize has been claimed, and the silhouette until then.
- The course progress tile gains a **prize tally** — how many of the course's prizes are claimed — with
  the course's prizes drawn small beneath it, in the same two states.
- Both read the claim the learner made on the counter. **Colour means claimed**, never merely "every
  ticket earned": the counter keeps the prize a silhouette until the learner claims it, and this page
  must not spoil that surprise a screen earlier.
- The prize is decoration: every tile's accessible name and the tally's own sentence carry the meaning,
  so nothing here rests on the illustration alone.

## Capabilities

### New Capabilities

<!-- None: this extends the course overview, which cinema-course-overview already owns. -->

### Modified Capabilities

- `cinema-course-overview`: the lesson tile shows its module's prize, and the course progress tile shows
  how many of the course's prizes are claimed. Both requirements gain the prize; neither changes what it
  already states about rings, status, tallies or the continue tile.

## Non-goals

- **Claiming from this page.** The prize is shown, never claimed here; claiming stays the counter's job
  on the Achievements page, where the reveal lives.
- **A second definition of "claimed".** This reads the same device claim the counter writes; it invents
  no new store, state or rule.
- **Ticket counts on this page.** How many tickets a module has collected is the counter's reading; the
  tile already states its own progress as videos and time.
- **Touching the continue tile, the rings, the status chips, the tallies or the module route.** The rest
  of the view is done and stays as it is.

## Impact

- `src/components/course-progress-board/course-progress-board.tsx` — reads the claimed prizes once and
  hands each tile its prize and whether it is claimed, as it already does for progress.
- `src/components/lesson-ring-tile/lesson-ring-tile.tsx` — draws the prize on the artwork band.
- `src/components/course-progress-tile/course-progress-tile.tsx` — draws the tally and the small prizes.
- Reuses `useClaimedPrizes`, `prizeForModule` and `PrizeIcon` unchanged; adds no port, adapter or store.
- `src/messages/{en,es,pt}.json` — the tally's sentence and the prizes' accessible names, under
  `CourseCatalog.courseOverview`.
- Tests and stories for the three components, and `e2e/course-overview.spec.ts`.
