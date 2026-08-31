## Why

The "Course outline" sidebar grows with the course. On the Advanced Intermediate
course (12+ modules, 107 lessons) the outline column is taller than the viewport, and
it scrolls with the page rather than on its own. A learner who opens a lesson from one
of the last modules lands on a view where the outline shows modules 1–10 and the
current lesson is somewhere far below the fold. The outline already marks the current
lesson (gold row, `aria-current="page"`) — the learner just cannot see the mark without
scrolling the whole page and losing sight of the player.

The result is that the one thing the outline exists to answer — *where am I in this
course?* — is unanswerable at the exact moment the learner arrives.

## What Changes

- The desktop outline sidebar becomes a **self-contained scroll region**: it sticks
  below the site header, its height is bounded by the viewport, and its lessons scroll
  inside it instead of pushing the page.
- On arrival, the outline **brings the current lesson into view within its own scroll
  region**, positioned near the middle so the surrounding lessons give context. The
  page's own scroll position is not touched — the learner still lands at the top of the
  lesson, looking at the player.
- The same positioning happens in the mobile drawer when the learner opens it, so the
  collapsed `<details>` outline does not open onto module 1.
- The adjustment is instant for everyone — the outline is simply already in the right
  place on first paint. No animated scroll runs, so `prefers-reduced-motion` is honoured
  by construction rather than by a branch.
- The outline stays usable when the current lesson cannot be located (a module the
  learner collapsed by hand, an outline with no current lesson): the region simply
  stays where it is, no error, no jump.

## Capabilities

### New Capabilities

None. This change refines how an existing surface behaves; it introduces no new
capability.

### Modified Capabilities

- `cinema-lesson-view`: the outline requirement says the current lesson is *marked*
  (`aria-current`) and that its module starts expanded. It says nothing about the mark
  being **visible**. The requirement gains the scroll-containment and
  bring-into-view behavior, plus the reduced-motion and no-page-scroll guarantees.

## Impact

**Code**

- `src/components/lesson-view/outline-drawer/outline-drawer.tsx` — the desktop `<aside>`
  gains sticky positioning, a viewport-bounded max height, and `overflow-y-auto`; it
  becomes the scroll container the bring-into-view logic targets.
- `src/components/lesson-view/outline/outline.tsx` — becomes a client component that
  owns the scroll-container ref and runs the positioning effect after mount.
- `src/hooks/` — a new hook (e.g. `use-scroll-current-into-view`) holding the DOM
  measurement and the `prefers-reduced-motion` read, colocated with its Vitest test,
  matching the existing `use-playback-position` / `use-is-hydrated` folder pattern.
- `src/components/lesson-view/lesson-list/lesson-list.tsx` — unchanged behavior; its
  `aria-current="page"` row is the anchor the hook looks for.
- Storybook stories for the outline / outline drawer gain a long-course story where the
  current lesson sits in a late module.
- `e2e/lesson-page.spec.ts` — a check that the current lesson row is in the viewport on
  arrival at a late-module lesson.

**Not affected**

- No domain, use-case, port, or adapter code. This is a presentation-layer change.
- No route, no data shape, no message keys (the behavior adds no visible copy).
- The module accordion behavior (which modules start expanded, multi-open, keyboard
  operation) is untouched.

## Non-goals

- Persisting the outline's scroll position across navigations. Each lesson view
  positions the outline from scratch.
- Re-positioning the outline when the learner expands or collapses a module by hand, or
  after they have scrolled the outline themselves. The adjustment happens on arrival
  (and on drawer open), not continuously.
- Virtualizing the outline. All rows of the expanded module continue to render; the
  scroll region is a CSS container, not a windowing strategy.
- Changing which modules start expanded, the current-lesson styling, the completion
  marks, or any other outline visual language.
- Moving focus to the current lesson. This is a scroll adjustment, not a focus change —
  hijacking focus on load would fight screen readers and the browser's own restoration.
- Applying the same treatment to the right rail (Resources / Up next) or to the course
  and module overview pages.
