## Context

The worktree currently implements `course-overview-marquee` (hero with backdrop + module
shelves), uncommitted and unmerged. Design review chose **J3 · Carrusel** for the page and
**K3 · Anillo** for the section under the carousel, both already mocked at 1440px and 390px
in the design canvas (rounds 3 and 4).

Progress is device-local and read on the client: completion marks through
`useCompletedLessons`, playback positions through `useSavedPlaybackPositions`, combined by
`countsAsComplete` (`src/lib/watch-progress`). `useModuleWatchProgress` already counts a
module with that rule. `useHorizontalSwipe` and `useIsHydrated` exist and are reused.

`findCourseForView` returns, per module, a capped `leadingLessons` preview (6) and an uncapped
`lessonRuntimes` list (id + runtime only). The panel must name any video in a module (e.g.
"Pick up /Flap/", Up next), so titles for every lesson are needed.

## Goals / Non-Goals

**Goals:**

- Pixel-faithful J3 hero + carousel and K3 panel, in both themes and at both widths.
- One pure, unit-tested function that decides a module's panel state and resume video.
- Server-rendered shell; only the carousel+panel island is a client component.

**Non-Goals:**

- Server-side progress, animation beyond scale/opacity transitions, authored "sounds" tags.

## Decisions

### D1 — Domain: `ModuleSummary.lessons` replaces the preview and the runtime list

`ModuleLesson = { id, sequence, title, durationSeconds, poster? }`, listed for every lesson
in `sequence` order. `leadingLessons`, `lessonRuntimes` and `LEADING_LESSONS_CAP` are
removed. `ModuleLesson` is a structural superset of the old `LessonRuntime`, so
`useModuleWatchProgress` keeps working when passed `summary.lessons`.

*Alternative:* add `title` to `LessonRuntime`. Rejected — two parallel lists describing the
same lessons invite drift; one list is simpler.

Payload: the advanced course has 107 lessons; titles and poster keys add a few KB to a
~166 KB document. Accepted.

### D2 — Panel state is a pure function in `src/lib/module-progress/`

```ts
moduleProgress({ lessons, completedIds, positions }) =>
  | { kind: "not-started"; target: ModuleLesson; upNext: ModuleLesson[] }
  | { kind: "in-progress"; target; targetIndex; completedCount; lessonCount;
      secondsLeftInTarget; secondsLeftInModule; upNext }
  | { kind: "completed"; first: ModuleLesson; lessonCount }
  | { kind: "empty" }
```

`target` is the first lesson in sequence that is not complete. Percent is
`completedCount / lessonCount` — the unit every other meter uses ("3 of 25 videos"); the
mock's 22% was illustrative. `useModuleProgress(lessons)` is a thin hook reading the two
stores and calling it; the function is where the rules are tested.

### D3 — Initial selection

`selectInitialModuleIndex(summaries, progressByModule)` (same lib): first module
`in-progress`; else first not `completed`; else 0. The server renders index 0; an effect
after hydration applies the computed index once (no animation on that jump).

### D4 — Components

- `CourseOverview` (server): hero + `<CourseCarousel>`; no longer maps shelves.
- `CourseCarousel` (client, `src/components/course-carousel/`): owns `selectedIndex`;
  renders posters, arrows, dots, the polite live region and `<LessonProgressPanel>` for the
  selected module. Receives plain serializable props (course, modules, summaries).
- `ModulePoster` (`src/components/module-poster/`): presentational portrait poster (collage,
  outlined ordinal, title, meta); `selected` and `distance` props drive size and opacity.
- `LessonProgressPanel` (client, `src/components/lesson-progress-panel/`): renders the four
  states from `useModuleProgress`; gated by `useIsHydrated` to the neutral server state.
- `ProgressRing` (`src/components/progress-ring/`): SVG ring, either `fraction` fill or
  `segments` with one lit. Purely presentational.
- Deleted: `ModuleShelf`, `VideoCard` (+ stories, tests). `useRuntimeLabel` is kept.

### D5 — Carousel layout and behaviour

Posters are absolutely positioned relative to a centred stage by their distance from the
selection (−2…+2 visible on `lg`, −1…+1 below), with CSS transitions on transform/opacity,
disabled under `prefers-reduced-motion`. Sizes from the mock: selected 300×450, ±1 230×345
at 0.7 opacity, ±2 180×270 at 0.4 (desktop); selected 240×360 with ±1 peeking at the screen
edges (mobile). The stage clips horizontally (`overflow-x: clip`) so nothing widens the page.

Posters are `<button>`s when not selected (select) and a `<Link>` when selected (open; module
overview, or the single lesson when `lessonCount === 1`). Arrows are buttons with
`aria-label`s; dots are buttons with `aria-current`. The region has
`aria-roledescription="carousel"`; a visually hidden `aria-live="polite"` node announces the
selection. `onKeyDown` on the region handles ArrowLeft/ArrowRight; `useHorizontalSwipe`
handles touch.

### D6 — Hero

Eyebrow "Now showing · {n} lessons", `h1`, meta line (videos · runtime) in normal flow below
the title (fixing the overlap seen in the canvas), Start course: right-aligned on `lg`,
full-width below. The description paragraph moves out of the hero (kept only in metadata).

### D7 — Messages

Under `CourseCatalog.courseOverview` in `en`, `es`, `pt`: `nowShowing`, `courseMetaShort`,
`carouselLabel`, `previousLesson`, `nextLesson`, `showLesson`, `selectionAnnouncement`,
`keepGoing`, `pickUp`, `videoOfTotal`, `timeLeft`, `timeLeftInModule`, `continueWatching`,
`openLesson`, `startThisLesson`, `videosReady`, `beginsWith`, `completedEyebrow`,
`allWatched`, `watchAgain`, `upNext`, `percentComplete`, `completedOfTotal`. `videosReady`
carries no number — the ring shows the count above it. Keys orphaned by removing the shelves
and showcase card (`courseMeta`, `startsWith`, `viewAll`, `remainingVideos`, `moduleMeta`,
`moduleListLabel`) are removed.

## Risks / Trade-offs

- [Selection jumps after hydration for returning learners] → Jump is instant, once, and
  only when progress exists; the alternative (rendering nothing until hydration) hides the
  whole carousel from the server render.
- [Carousel hides most modules at once] → Dots show the count, arrows and swipe are always
  available, and every module is still reachable from the module overview links.
- [Hover/touch-only affordances] → Everything is operable by keyboard: arrows, dots, keys,
  and the selected poster link.
- [Removing `leadingLessons` ripples into tests and stories] → Mechanical; covered by
  typecheck.

## Migration Plan

Replace the uncommitted marquee implementation in this worktree; delete
`openspec/changes/course-overview-marquee/` so a single change describes the final state.
Rollback: revert the PR.

## Open Questions

_None blocking._ Decisions a reviewer may want to override: percent unit (D2), completed
state actions, initial selection rule (D3).

## Testing strategy

| Behavior | Layer | File (pattern mirrored) |
| --- | --- | --- |
| Summary lists every lesson with title/runtime/poster; zero runtime for reading | Vitest unit | `find-course-for-view.test.ts` |
| Panel state: not-started / in-progress / completed / empty; target, time left, up next | Vitest unit | `src/lib/module-progress/module-progress.test.ts` |
| Initial selection rule | Vitest unit | same folder |
| `ProgressRing` fraction vs segments, `aria-hidden` decoration | Vitest + RTL | `progress-ring.test.tsx` |
| `ModulePoster` collage count, ordinal, title, meta, placeholder | Vitest + RTL | `module-poster.test.tsx` |
| Panel renders each state from seeded localStorage; neutral pre-hydration; links | Vitest + RTL | `lesson-progress-panel.test.tsx` (mirrors watch-progress localStorage seeding) |
| Carousel: arrows/dots/keys/click select; selected poster links (module / single lesson); live region; initial selection after hydration | Vitest + RTL + user-event | `course-carousel.test.tsx` |
| Hero copy, single Start course | Vitest + RTL | `course-overview.test.tsx` |
| Loading shell traces hero, carousel, panel | Vitest + RTL | `loading.test.tsx` |
| Posters' artwork loads; arrows move selection; selected poster opens module; one-video module opens lesson; panel start CTA opens first video; seeded progress shows Continue; no horizontal overflow at 390px; meta below title | Playwright | `e2e/course-overview.spec.ts` |
| One click from the selected poster to the module | Playwright | `e2e/one-click-navigation.spec.ts` |
| Visual fidelity to J3/K3 at 1440/390, dark and light | Playwright MCP / screenshots | — |
