## Context

`LessonView` renders a `grid gap-8 lg:grid-cols-[260px_1fr_280px]`. Below `lg` that grid
is one column, so the three regions stack in source order: outline drawer, main, aside.
The aside holds `ResourceList` and `UpNextCard`, which puts the next-lesson link after
everything else on the page — including `MarkAsCompleteButton`, which is the last thing
in `main`.

`UpNextCard` is a `<section aria-label>` with a gold-tinted border, a `text-xs` eyebrow
and an inline `Link` (`min-h-9`). `MarkAsCompleteButton` is a client component owning a
transition and a browser-storage read; it renders an `inline-flex min-h-11` gold button
plus an `aria-live` status line.

The learner picked the "complete and continue" direction from the design canvas: on a
phone the two become one closing surface at the end of `main`, and the desktop layout
does not move.

## Goals / Non-Goals

**Goals:**

- One closing block at the end of `main` below `lg`: prompt, full-width "Mark as
  complete", divider, next-lesson row with a ≥44px target.
- Exactly one next-lesson affordance visible at any viewport width.
- `lg` and up renders byte-for-byte what it renders today.
- `MarkAsCompleteButton` keeps its single mount, its state and its behaviour.

**Non-Goals:**

- Any change to `findNextLessonToRecommend`, the domain, or the lesson route data.
- Enriching the row with thumbnail, duration or module name.
- Refactoring `UpNextCard`, `ResourceList` or the rail's own layout.

## Decisions

### D1 — One new component, not two

`LessonCloseCard` (`src/components/lesson-view/lesson-close-card/`) owns the whole
closing surface. The next-lesson row is a private function component in the same file,
not an exported `UpNextRow` folder.

*Why:* the row is used in exactly one place and is meaningless outside the card, which
is what the project's folder-per-entity rule exempts ("plain helpers used in exactly one
place ... keep them in their caller's file"). One folder means one story, one test file
and one `Components.LessonCloseCard` namespace instead of two of each.

*Alternative rejected:* exporting `UpNextRow` so the rail card could later reuse it. The
rail card renders a different shape (block, no glyph, no chevron); sharing would mean a
variant prop for one caller each.

### D2 — The button is passed as `children`, not rebuilt

`LessonCloseCard` takes `course`, `nextLesson`, `nextLessonModule` and `children`, and
`LessonView` passes the existing `<MarkAsCompleteButton>` into it.

*Why:* the card stays a presentational component with no knowledge of the Server Action,
the lesson id or the progress store, so its test needs no action stub. It also keeps the
"one mount of the button" invariant obvious at the call site.

*Alternative rejected:* giving the card `lessonId` + `markComplete` and rendering the
button itself — five props, and every card test would have to stub the action.

### D3 — One mount, phone-only chrome — not two conditional trees

The card always renders. Its chrome (card background, border, radius, padding), the
prompt, the divider and the next-lesson row carry `lg:hidden` / `lg:`-neutralised
classes, so from `lg` up the card collapses to a transparent wrapper around the button
and the page looks exactly as it does today. The rail's `UpNextCard` is wrapped in
`hidden lg:block`.

*Why:* the alternative — rendering the block below `lg` and the bare button above it —
would mount `MarkAsCompleteButton` twice. Two mounts means two `aria-pressed` controls
and two `aria-live` status lines in the accessibility tree at any width (only one
visible, but both real), and every test and e2e selector would have to disambiguate.
One mount keeps `getByRole("button", { name: /mark as complete/i })` unambiguous.

*Consequence, accepted:* below `lg` the DOM still contains the rail's `UpNextCard` with
`display: none`. It is hidden from assistive tech, so the "offered exactly once"
requirement holds for what a learner perceives; jsdom, which applies no CSS, will see
both, so component tests assert structure (which block contains which link) rather than
counting links. The e2e layer, which does apply CSS, asserts visibility and the count.

### D4 — Full-width button via the button's own classes

`MarkAsCompleteButton` gains `w-full lg:w-auto` on its `<button>` and
`items-stretch lg:items-start` on its wrapper.

*Why:* the full-width shape belongs to the button at phone width regardless of who
renders it, and the `lg:` variant leaves the desktop rendering unchanged. The
alternative — a `className` or `fullWidth` prop — would leak layout from the parent into
a component that has no other styling knobs.

### D5 — Route building and icons follow the existing vocabulary

The row's `href` comes from `lessonPath(course, nextLessonModule, nextLesson)` in
`@/i18n/lesson-routes`, routed through `Link` from `@/i18n/navigation`. The glyph and
chevron are `Play` and `ChevronRight` from `lucide-react`, `aria-hidden`.

*Why:* `lessonPath` is the project's single URL builder; `UpNextCard` concatenating the
string by hand is the outlier, and new code should not copy it. (Changing `UpNextCard`
to use it is out of scope for this change.) The whole row is one `Link` whose accessible
name is the lesson title, so a screen reader announces the destination.

### D6 — Copy lives in `Components.LessonCloseCard`

Three keys in `en`, `es` and `pt`: `prompt`, `upNext`, `courseCompleted`.
`courseCompleted` duplicates the string `Components.UpNextCard.courseCompleted` already
carries, rather than reaching across namespaces.

*Why:* the project's convention is one namespace per component, and a component reading
another component's namespace couples their copy — renaming the rail card's message
would silently change the closing block's.

## Risks / Trade-offs

- **[Duplicate next-lesson link in the DOM below `lg`]** → the rail copy is
  `display: none`, invisible to assistive tech; e2e asserts exactly one *visible* link
  at 390px and at 1280px.
- **[A future viewport-fit regression: the row's title is long and the chevron has a
  fixed width]** → the row is a flex layout with a `min-w-0` growing text column and a
  `shrink-0` chevron, so the title wraps instead of pushing the document wide. The
  existing `responsive-viewport-fit` e2e sweep already renders the lesson page at 320px
  and 390px in all three locales and would catch a regression.
- **[`lg:`-neutralised chrome drifts out of sync with the rail card's look]** → the card
  uses the same tokens as `ResourceList` (`border-border`, `bg-card`, `rounded-xl`), not
  new values, so a token change moves both.
- **[Component tests cannot see the breakpoint]** → accepted and covered by D3: jsdom
  tests assert structure and content, Playwright asserts what is actually visible.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Vitest + RTL | `src/components/lesson-view/lesson-close-card/lesson-close-card.test.tsx` (new) | The prompt renders; `children` render inside the card; the row is one link whose accessible name contains the next lesson's title; the `href` uses the *next lesson's* module slug and the active locale; with `nextLesson: null` the terminal message renders and no link exists. Mirrors `up-next-card.test.tsx`. |
| Vitest + RTL | `src/components/lesson-view/lesson-view/lesson-view.test.tsx` (extend) | The closing block is inside `main` and contains the "Mark as complete" button; the rail still renders its `UpNextCard`; the button is mounted exactly once on the page. Mirrors the existing composition assertions in that file. |
| Vitest + RTL | `src/components/lesson-view/mark-as-complete-button/mark-as-complete-button.test.tsx` (extend) | The button carries the full-width class pair, so the `lg:` escape hatch cannot be dropped silently. |
| Playwright | `e2e/lesson-page.spec.ts` (extend) | At a 390px viewport: the closing block's next-lesson link is visible with the right `href`, the rail's "Up next" region is hidden, and exactly one visible link addresses the next lesson. At the default desktop viewport: the rail card is visible and the closing row is not. Mirrors the existing "Up next card points to the next lesson" block and the `test.use({ viewport })` pattern from `e2e/mobile-viewport.spec.ts`. |
| Storybook | `lesson-close-card.stories.tsx` (new) | `Default` (next lesson present) and `CourseCompleted` (terminal state), reviewed at a phone viewport in `en`/`es`/`pt` via the toolbar. Copy comes from `.storybook/messages` `Stories.*` where the story needs its own strings. |

Every task is TDD: the failing test named in this table is written before the production
code it describes, per `AGENTS.md`.
