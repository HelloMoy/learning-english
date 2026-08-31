## Why

The module overview opens with a decorative tile: a warm gradient box carrying the
module ordinal (`01`) and the first word of the module title in caps (`ADVANCED`).
It is `aria-hidden`, it links nowhere, and it holds no information the header does
not already state one line to its right — the eyebrow reads `4 videos · Lesson 01`
and the `<h1>` reads `Advanced Pronunciation Course`. The ordinal is duplicated and
the headline is a truncation of the title.

Unlike the course overview's `PosterCard`, this tile has no artwork behind it: the
`Module` entity carries no `poster`, so the gradient is all there ever is to show.
It costs roughly 160px of vertical space above the video list — the thing the
learner actually came for — and pushes the first row below the fold on short
viewports.

## What Changes

- The module overview header drops the decorative gradient tile. The back link,
  eyebrow, title and video list are unchanged.
- The header becomes a single vertical stack instead of a two-column
  poster-beside-text row.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cinema-module-overview`: the "Module overview renders as an episode list with a
  hero poster" requirement mandates the hero `PosterCard`. The requirement is renamed
  and restated without it; every other clause — the eyebrow, the title, the row
  contents, the row thumbnail rules, localization — carries over verbatim.

## Impact

**Code**

- `src/components/module-overview/module-overview.tsx` — the `aria-hidden` tile and
  the `posterHeadline` derivation are removed; `moduleNumber` stays (the eyebrow uses
  it) and `THUMB_GLOW` stays (the per-row thumbnails use it).

**Not affected**

- The row thumbnails, their poster/fallback behaviour, and their pointer-only link.
- The course overview's `PosterCard`, which renders real artwork and is a different
  surface.
- Any domain, port, use-case, or adapter code. Presentation only.
- The existing `module-overview.test.tsx` cases — none asserted the tile.

## Non-goals

- Giving `Module` a `poster` field or sourcing module artwork. If artwork ever
  exists, restoring a hero is its own change with a real image behind it.
- Touching the course overview, the home page, the outline sidebar, or the lesson page.
- Restyling the header beyond dropping the tile — the eyebrow, title, and spacing
  scale stay as they are.
