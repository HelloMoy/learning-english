## Why

The closing card — the prompt, the full-width "Mark as complete" button and the "Up next"
row beneath a divider — was built phone-only. From `lg` up it collapses to a bare
button with no prompt and no surface, and the next lesson moves to a 14px text link in
the right rail. Finishing a lesson and starting the next one are one moment for the
learner on every device, not only on a phone; the desktop deserves the same closing
surface, and the lonely button it renders today should go.

## What Changes

- The **closing card** renders its full chrome — card surface, prompt, full-width
  "Mark as complete", divider, next-lesson row (or the end-of-course message) — at
  every viewport width. The `lg` collapse to a bare button is removed.
- The card **moves into the right rail, directly below the Resources card**. From `lg`
  up that is the column to the right of the player; below `lg` the rail stacks after
  the center column, so the phone keeps its order: content, materials, closing card.
- The **Resources card is rendered once**, in the rail. The phone-only copy inside the
  center column is gone, since the rail now stacks in the right place on its own.
- The standalone desktop "Mark as complete" button is gone: the only completion control
  on the page is the one inside the closing card, at every width.
- The right rail's **"Up next" card is removed** at every width, so the next lesson
  keeps being offered exactly once. The `UpNextCard` component, its story, its test,
  its barrel export and its `Components.UpNextCard` messages are deleted as dead code.
- The right rail now carries the **Resources** card alone from `lg` up, as it already
  does when stacked.

## Non-goals

- No change to which lesson is recommended (`findNextLessonToRecommend`).
- No change to the "Mark as complete" behaviour: same dual write, same completed and
  pending states, same unmark confirmation, same celebration.
- No change to the card's content: no thumbnail, duration or module breadcrumb.
- No change to the Resources card's content or to the outline.
- No new translation keys; the `Components.LessonCloseCard` and
  `Components.LessonCompletionToggle` copy is reused as-is.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-close-card`: the closing block is no longer phone-class only — it renders at
  every width, in the right rail below Resources; the "phone-only next-lesson
  affordance" requirement is removed and the "offered exactly once" invariant is kept
  by removing the rail card instead. The Resources card is rendered once.
- `lesson-page`: the composition requirement places "Up next" in the right rail and
  "Mark as complete" below the player; both now live in the closing block, which ends
  the rail below Resources at every width. `UpNextCard` leaves the component list.
- `cinema-lesson-view`: the three-column layout requirement names an "Up next" card in
  the right rail; the rail is now Resources followed by the closing block.

## Impact

- `src/components/lesson-view/lesson-close-card/lesson-close-card.tsx` — drops its `lg:`
  collapse; story and JSDoc updated.
- `src/components/lesson-view/lesson-completion-toggle/lesson-completion-toggle.tsx` —
  prompt and full-width button at every width, including the unknown-state skeleton;
  story and JSDoc updated.
- `src/components/lesson-view/lesson-view/lesson-view.tsx` — the rail is `ResourceList`
  then `LessonCloseCard`, each rendered once; `UpNextCard` and the center column's
  phone copy of the materials are gone; JSDoc updated.
- `src/components/lesson-view/up-next-card/` — deleted; `src/components/lesson-view/index.ts`
  drops the export.
- `src/messages/{en,es,pt}.json` — `Components.UpNextCard` namespace removed.
- `e2e/lesson-page.spec.ts` — next-lesson assertions target the closing card at every
  width; the desktop scenario asserts the card, not the rail.
- No domain, port, adapter or use-case change.
