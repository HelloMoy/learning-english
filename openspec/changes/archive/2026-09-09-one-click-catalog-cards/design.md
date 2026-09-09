## Context

Three components own the affordances this change touches, and all three were
deliberately built as *containers with links inside* rather than as one wrapping
link. Their JSDoc says why: a wrapping link swallows the whole subtree into its
accessible name ("Basic Course American pronunciation from the ground up…
Lesson 1 Introduction… 5 lessons 48 videos Continue course"), and a deck of six
lesson cards turned into links adds sixty tab stops per course overview.

That reasoning is still right. What is wrong is only the *pointer* hit area — a
purely visual concern that assistive technology never sees.

Separately, `CourseLadder` today reads only the `courseSlug` out of the stored
continue-watching location, because marking a card is all it needed. To resume a
lesson it needs an href, and an href it can trust.

## Goals / Non-Goals

**Goals:**

- The in-progress course card resumes the actual lesson, and still offers the
  course overview as a secondary action.
- Clicking anywhere on a showcase card or a video row navigates.
- Neither change alters the accessibility tree, the tab order, or any accessible
  name.
- The row action's label names watching a video.

**Non-Goals:**

- Making the showcase card's gallery cards individually clickable.
- Making the course card's module preview rows clickable.
- Any new domain port, use case or server action.
- Touching the `ContinueWatching` panel.

## Decisions

### 1. Extend the hit area with a stretched pseudo-element, not a wrapping link

Give the container `relative` and the existing link `after:absolute after:inset-0`
(plus `after:content-['']`). The `::after` box is invisible, covers the container,
and belongs to the link — so the pointer target grows while the DOM, the
accessibility tree and the tab order stay byte-for-byte as they are.

Alternatives rejected:

- **Wrap the whole card in one `<Link>`.** Destroys the accessible name and
  nests the heading link inside another link, which is invalid HTML.
- **`onClick` on the container.** Turns a link into a div-with-a-handler: no
  middle-click, no ⌘-click, no "open in new tab", no href in the status bar.

On the course card the stretched link is the **title**, not a call to action —
the body's destination is the course overview, and the title is the link that
already goes there. The two foot actions must therefore win over the overlay,
which they do by sitting in a `relative z-20` block above the overlay's `z-10`.
That layering is the whole mechanism: one overlay for the body, one raised block
for the exceptions.

Consequences to handle:

- The showcase card's gallery cards carry explicit `zIndex` values (up to the
  number of leading lessons). The overlay must paint above them, so it gets an
  explicit `after:z-10` and the deck stays in its own stacking context (it
  already creates one via `perspective`).
- The card's heading link sits *under* the overlay. Pointer-wise both go to the
  same place, so nothing is lost; it stays keyboard-focusable and announced.
- On the module overview the row's thumbnail link is also covered — same
  destination, and it was already pointer-only.

### 2. `CourseLadder` resolves the location through the existing server action

The ladder currently trusts the raw `localStorage` record for the course-slug
match. Building a lesson href from that same raw record would be one line — but
a record pointing at a lesson that has since been renumbered or removed would
turn today's always-valid course link into a 404.

So the ladder resolves the location through `findContinueWatchingAction`, the
same action the `ContinueWatching` panel uses, and takes `lessonHref` from the
result. A location that no longer resolves yields `null`, and every card falls
back to the not-started state — which is also the more honest reading of a dead
record than today's "in progress" badge.

Alternatives rejected:

- **Build the href from the stored location with `lessonPath`.** No round-trip,
  but ships a link the server has not confirmed.
- **A new server action returning just the href.** `findContinueWatchingAction`
  already returns it; a second action would duplicate the use case call.
- **Hoist the resolution into `HomeView` and share it with the panel.** Removes
  the duplicate round-trip, but forces the presentational `HomeView` to become a
  client component and couples two independent sections. Deferred — the action
  is a cheap in-memory lookup and both callers already tolerate resolving late.

The resolver is injected the same way `ContinueWatching` injects it (a
`resolve?:` prop defaulting to the action), so component tests pass a plain
function instead of mocking the action.

### 3. `CourseLevelCard` takes a `resumeHref` *instead of* `state`

The `state: CourseLevelState` prop is replaced by `resumeHref: string | null`.
Present ⇒ in-progress: the badge is marked, the primary action resumes that
lesson, and the secondary `View course content` action renders beneath it.
Absent ⇒ not started: today's single `Start course` action.

The two props carried the same fact, and keeping both would let a caller pass
`state="in-progress"` with no href — a card promising to continue something it
cannot reach. Deriving the state from the href makes that unrepresentable. The
rendered `data-state` attribute stays, so the ladder's tests and the e2e specs
keep the hook they already assert on.

`CourseLevelState` remains exported: it is the type of that attribute's two
values, and the ladder still reasons in those terms.

### 4. The secondary action is a link styled as a quiet button

It reuses the not-started card's own button treatment (bordered, `bg-foreground/5`)
so the primary/secondary hierarchy reads without introducing a third style. Both
actions stack in a `flex-col gap-2` block pinned to the card bottom by the
existing `mt-auto`, which moves from the link onto that block.

### 5. Message keys

| Locale | `Components.CourseLevelCard.viewCourseContent` | `CourseCatalog.moduleOverview.watchVideo` |
| ------ | --------------------------------------------- | ----------------------------------------- |
| `en`   | View course content                           | Watch video                               |
| `es`   | Ver contenido del curso                       | Ver video                                 |
| `pt`   | Ver conteúdo do curso                         | Assistir vídeo                            |

`CourseCatalog.moduleOverview.open` is removed rather than repurposed — a key
named `open` holding "Watch video" is the kind of drift that makes message files
unreadable. `grep` confirms `open` has no other caller.

## Risks / Trade-offs

- **A second server round-trip on the home** (`CourseLadder` and
  `ContinueWatching` each resolve the same location) → the action is an
  in-memory catalog lookup, and both components already render their honest
  pre-resolution state first. Decision 2 records the hoist as the fix if this
  ever shows up in a profile.
- **The stretched overlay swallows text selection** inside the card and the row →
  accepted: these panels hold titles and counts, not prose anyone copies. Text
  that must stay selectable would need its own `relative z-20`.
- **The overlay could cover a future interactive child** (a bookmark toggle, a
  menu) → any such control must be given `relative z-20` when added. Noted in
  the components' JSDoc so the next author sees it.
- **A learner who expects `Continue course` to open the course index** now lands
  in the player → mitigated by the secondary action, which states that
  destination in words instead of leaving it implied.

## Testing strategy

| Behavior | Layer | Where |
| --- | --- | --- |
| `CourseLevelCard` renders one action to the course overview when `resumeHref` is absent | Vitest + RTL | `src/components/course-level-card/course-level-card.test.tsx` |
| `CourseLevelCard` still exposes only its title and its actions as links, with unchanged accessible names, after the body hit area is extended | Vitest + RTL | same file |
| `CourseLevelCard` points its primary action at `resumeHref` and renders the secondary action to the course overview when present | Vitest + RTL | same file |
| `CourseLadder` hands the resolved `lessonHref` to the matching card only, and falls back to not-started when the resolver answers `null` | Vitest + RTL, injected `resolve` + fake `ContinueWatchingRepository` | `src/components/course-ladder/course-ladder.test.tsx` |
| `ModuleShowcaseCard` still exposes exactly two links with unchanged accessible names | Vitest + RTL | `src/components/module-showcase-card/module-showcase-card.test.tsx` |
| `ModuleOverview` still exposes exactly one announced link per row, labelled with the watch-video copy | Vitest + RTL | `src/components/module-overview/module-overview.test.tsx` |
| The whole card / row actually navigates on a pointer click, and the course card's foot actions still win over its body | Playwright | `e2e/` — a click at the card's own centre point, which no button occupies, plus a click on each foot action |

The RTL tests mirror the existing files' conventions: `@faker-js/faker` for
arbitrary titles and slugs, `getAllByRole("link")` for the tab-order assertions,
and the fake-repository injection pattern already used by
`course-ladder.test.tsx` and `continue-watching.test.tsx`.

Hit-area geometry is not assertable in jsdom — `::after` has no layout there — so
the pointer behavior is verified by Playwright and by a Playwright MCP visual
pass in the browser, while RTL owns the invariant that matters for regressions:
the link count and the accessible names must not change.

Stories are updated alongside: `CourseLevelCard` gains an in-progress story with
a `resumeHref` so the two-action layout is reviewable in all three locales.
