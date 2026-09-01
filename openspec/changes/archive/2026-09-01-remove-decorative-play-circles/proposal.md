## Why

Both the home's `Continue watching` panel and each module showcase card on the course
overview render a large gold circle with a play glyph next to their real call to action.
The circle is inert — `PlayButton` is rendered with `decorative`, so it is a `<span>` that
does nothing — yet it is the loudest element in its panel and reads as the primary way to
start watching. A learner who clicks it gets no response, and the panel ends up offering
two playback affordances where only one is real ("Resume" / "View videos").

## What Changes

- Remove the decorative `PlayButton` from the `Continue watching` panel on the home.
- Remove the decorative `PlayButton` from the left panel of `ModuleShowcaseCard` on the
  course overview.
- Each panel keeps exactly one action: `Resume` on the home panel, `View videos` on the
  showcase card. The action's label, target and styling are unchanged.
- No change to `PlayButton` itself — it stays in use on `PosterCard` and the module
  overview, where it sits over lesson artwork rather than beside a button.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-course-overview`: the showcase card's left panel no longer carries a decorative
  play affordance; its call to action is the panel's only playback signal.
- `continue-watching`: the home panel's only playback affordance is the action that
  navigates to the lesson.

## Non-goals

- Deleting or changing the `PlayButton` component, its `decorative` prop, or its other
  callers (`PosterCard`, module overview lesson rows).
- Any change to the panels' layout system, glow, spacing scale or copy beyond what
  dropping the circle requires.
- Making the circle interactive instead of removing it — the user asked for its removal.
- Revisiting the receding gallery, the progress bar, or the ordinal treatment.

## Impact

- `src/components/continue-watching/continue-watching.tsx` — drop the `PlayButton` and the
  wrapper that positioned it; the panel becomes a single column.
- `src/components/module-showcase-card/module-showcase-card.tsx` — drop the `PlayButton`
  and the flex row that paired it with the call to action.
- Tests: `continue-watching.test.tsx`, `module-showcase-card.test.tsx` gain assertions that
  no decorative play affordance renders.
- Specs: delta files for `cinema-course-overview` and `continue-watching`.
- No domain, adapter, route or translation changes; no new or removed dependencies.
