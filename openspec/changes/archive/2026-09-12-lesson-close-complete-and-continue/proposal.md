## Why

On a phone the Lesson Page collapses to one column, so the right rail lands at the very
bottom: the learner finishes the video, scrolls past Notes, Resources and the "Mark as
complete" button, and only then reaches the "Up next" card — a 14px line of text pinned
against the browser toolbar. The one action that keeps a learner in the course is the
hardest one to find, and its tap target is a text link rather than a control.

Finishing a lesson and starting the next one are one moment for the learner. On phone
they should be one block.

## What Changes

- A new **lesson close card** renders at the end of the Lesson Page's center column on
  phone-class viewports: a short prompt, the "Mark as complete" button at full width,
  a divider, and — below it — a row linking to the next lesson (play glyph, the
  "Up next" eyebrow, the lesson title, a chevron) with a tap target of at least 44px.
- When the learner is on the last lesson of the course, that row carries the existing
  terminal "course completed" message instead of a link, matching today's card.
- The "Mark as complete" button becomes full width inside the card on phone and keeps
  its current intrinsic width from `lg` up.
- From `lg` up nothing moves: the right rail keeps its "Up next" card and the button
  keeps its current place and shape. The close card's chrome, prompt and next-lesson row
  are phone-only, so the next lesson is never offered twice at the same width.

## Non-goals

- No change to which lesson is recommended — `findNextLessonToRecommend` and its
  module-crossing rule are untouched.
- No thumbnail, duration, or module breadcrumb on the next-lesson row: the data the
  card renders stays exactly what the "Up next" card renders today.
- No sticky/docked bar, no carousel of upcoming lessons — those were the rejected
  variants.
- No change to the desktop three-column layout, the Resources card, or the outline.
- The "Mark as complete" behaviour (dual write to browser and server trackers) is
  unchanged.

## Capabilities

### New Capabilities

- `lesson-close-card`: the end-of-lesson block on the Lesson Page — how "Mark as
  complete" and "Up next" compose into one closing surface, and at which viewport
  widths each part is shown.

### Modified Capabilities

- `lesson-page`: the composition requirement currently places "Mark as complete" in the
  footer and "Up next" in the aside unconditionally; it gains the phone-class placement.
- `cinema-lesson-view`: the three-column layout requirement states the right rail
  contains exactly the Resources and Up next cards; it gains the phone-class exception.

## Impact

- `src/components/lesson-view/lesson-close-card/` — new component (implementation,
  Vitest + RTL test, Storybook story, JSDoc).
- `src/components/lesson-view/lesson-view/lesson-view.tsx` — composes the close card in
  the center column and hides the rail's "Up next" card below `lg`.
- `src/components/lesson-view/mark-as-complete-button/mark-as-complete-button.tsx` —
  full width below `lg`.
- `src/components/lesson-view/index.ts` — barrel exports.
- `src/messages/{en,es,pt}.json` — new `Components.LessonCloseCard` namespace.
- `e2e/` — the lesson-page walkthrough asserts the next-lesson affordance at phone width.
- No domain, port, adapter, or use-case change: this is a delivery-layer composition.
