## Why

The catalog cards look like one thing to click but behave like several. A course
card in progress says `Continue course` and then drops the learner on a course
overview two more clicks from the video they were watching — the home's own
`Resume` action, three inches above, goes straight there. On the course and
module overviews the whole card reads as a target (glow, border, hover-lit
title) while only a small button inside it actually navigates, so a click on the
card body does nothing.

## What Changes

- `Continue course` on an in-progress course card navigates to the lesson the
  learner left off at — the same destination as the home's `Resume` — instead of
  to the course overview.
- An in-progress course card gains a second, secondary action beneath the primary
  one that goes to the course overview, so the destination the primary action
  gives up is still one click away. A not-started card is unchanged: one action,
  to the course overview.
- The body of a course card becomes a pointer target for the course overview —
  the destination its title already has — while the actions pinned at its foot
  keep their own, different destinations.
- The whole module showcase card on the course overview becomes a pointer target
  for its module overview, not just its `View videos` button.
- The whole video row on the module overview becomes a pointer target for its
  lesson, not just its trailing button.
- That button's label stops being `Open` and names what it does — watch the
  video — in all three locales.
- Neither whole-area target adds a tab stop or changes what a screen reader
  announces: the existing link stays the row's / card's one announced control and
  merely extends its hit area.

## Capabilities

### New Capabilities

None. Every change refines behavior that existing specs already describe.

### Modified Capabilities

- `cinema-home`: the in-progress course card's call to action resumes the stored
  lesson rather than opening the course overview, the card carries a second
  action for the course overview, and the card's body becomes clickable.
- `cinema-course-overview`: the showcase card's clickable area becomes the whole
  card rather than the call to action alone.
- `cinema-module-overview`: the video row's clickable area becomes the whole row
  rather than the trailing action alone, and that action is renamed.

## Non-goals

- No change to the `Continue watching` panel itself — it already behaves as
  wanted and is the model the course card is being made to match.
- No change to the not-started course card: it keeps its single `Start course`
  action to the course overview.
- No new server actions, ports or use cases. The lesson the learner left off at
  is already resolvable through `findContinueWatchingAction`.
- The receding gallery's cards stay non-interactive and hidden from assistive
  technology; extending the card's hit area does not turn them into links.
- No change to the module overview's row thumbnail treatment (pointer-only,
  outside the accessibility tree).

## Impact

- `src/components/course-level-card/course-level-card.tsx` — a resume href, a
  second action, and a stretched hit area on the title with the actions layered
  above it.
- `src/components/course-ladder/course-ladder.tsx` — resolves the stored location
  into a lesson href to hand down, instead of only reading its course slug.
- `src/components/module-showcase-card/module-showcase-card.tsx` — stretched hit
  area on the panel.
- `src/components/module-overview/module-overview.tsx` — stretched hit area on the
  row; renamed action.
- `src/messages/{en,es,pt}.json` — one new key for the secondary course action,
  one renamed key for the row action.
- Colocated tests and stories for each of the four components.
