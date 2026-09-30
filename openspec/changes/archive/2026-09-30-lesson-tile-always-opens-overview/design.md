## Context

`moduleEntryPath(course, module, lessons)` in `src/i18n/lesson-routes.ts` returns the lesson page when
`lessons.length === 1` and the module overview otherwise. Two callers use it: the course overview's
`LessonRingTile` and `ModuleOverview`'s finale (`nextModule` → `ModulePrize`'s `NextLessonLink`). The
specs tie the finale's destination to the tile's, so both must change together.

## Goals / Non-Goals

**Goals:**
- One destination for "open this lesson (module)" from outside it: its module overview.

**Non-Goals:**
- Anything under the proposal's Non-goals (module overview page behaviour, video-targeted links).

## Decisions

- **Delete `moduleEntryPath` instead of changing its body.** Once it always returns the overview it is
  a synonym of `moduleOverviewPath` with an unused `lessons` argument. Keeping it would leave a dead
  parameter and a misleading name. Callers switch to `moduleOverviewPath(course, module)`.
  _Alternative:_ keep the function as an indirection point for "module entry" — rejected; there is no
  second rule to hold, and `moduleOverviewPath` already is the central URL builder.
- **`ModuleOverview` keeps receiving `nextModule.lessons`.** The finale still needs to know the next
  lesson exists and holds videos (the caller already filters on that); only the href computation
  stops reading the lessons. Whether the prop can shrink is decided while refactoring, guided by the
  existing tests — not a goal of this change.

## Risks / Trade-offs

- [One extra click to reach a single-video lesson's video] → Accepted: it is the requested behaviour;
  the overview's route already features that video as the current step with its own CTA.

## Testing strategy

- **Vitest unit** — `src/i18n/lesson-routes.test.ts`: the `moduleEntryPath` suite is removed with the
  function; a `moduleOverviewPath` case covers the path shape if none exists.
- **Vitest + RTL** — `src/components/lesson-ring-tile/lesson-ring-tile.test.tsx`: the "exactly one
  video" case flips to expect the module overview href (red first). `src/components/module-overview/module-overview.test.tsx`:
  the "next lesson holds one video" finale case flips to expect the next module's overview href.
- **Playwright** — `e2e/course-overview.spec.ts`: clicking the tile of a one-video lesson lands on
  its module overview URL. Mirrors the existing tile specs in that file.
