## Context

The rule for "the video to continue" exists once in code, inside `deriveModuleRoute`
(`src/lib/module-route/module-route.ts`): `anchorIndex` picks the last opened video when it is in the list,
otherwise the furthest video with progress; `currentStepIndex` keeps the anchor when unfinished, otherwise
takes the first unfinished video after it, otherwise the first unfinished video of the list. It is
specified only by `cinema-module-overview` ("The current lesson is featured on the route").

Surfaces that offer to continue, as audited:

| Surface | Today | Follows the rule |
|---|---|---|
| Module overview — featured route step | `deriveModuleRoute` | yes (reference) |
| Course overview — continue tile | recorded video, even when finished | no (being fixed in `course-overview-rings`, task 1.5) |
| My learning — Resume panel | `useResolvedContinueWatching` → recorded video | no |
| My learning — lead lesson card's Continue | same record | no |
| My learning — courses table "Continue course" | links to the course overview | defers to the course overview |
| Home — Continue | links to My learning | defers to My learning |
| Lesson page — Up next / course navigator | the video after the open one | different concept, out of scope |

My learning receives each course's `lessonRuntimes` (`id`, `moduleId`, `durationSeconds`) straight from
`lessons.listByCourse`, unsorted and without `sequence`.

## Goals / Non-Goals

**Goals:**
- One function and one capability spec decide the video to continue; every continue surface calls it.
- No behavior change on the module overview.

**Non-Goals:**
- Up next, the course navigator, completion rules, record storage or server resolution.

## Decisions

### 1. `findContinueTarget` in `src/lib/continue-target/continue-target.ts`

```ts
type ContinueVideo = { id: LessonId; durationSeconds: number };
type LearnerProgress = { completedLessonIds; positions; lastOpenedLessonId? };
type ContinueTarget =
  | { kind: "none" }                      // the list holds no videos
  | { kind: "start"; index: number }      // no anchor: nothing watched, no record in the list
  | { kind: "continue"; index: number }   // the anchor or the first unfinished video after/before it
  | { kind: "rewatch"; index: number };   // every video finished; index 0
function findContinueTarget(videos: ReadonlyArray<ContinueVideo>, progress: LearnerProgress): ContinueTarget;
```

Callers pass videos **in learning order**; the function never sorts, so one list order decides everything.
Completion uses `countsAsComplete` and progress uses `watchedFraction`, exactly as `deriveModuleRoute`
does today. `LearnerProgress` moves here and `module-route` re-exports it so existing imports keep working.

*Why an index and a kind:* the module route needs the index to mark a step; the course overview and My
learning need the kind for their labels. *Alternative:* return the lesson id — rejected, callers already
hold the list and would search it again.

### 2. `deriveModuleRoute` delegates

`promoteCurrent` becomes: steps → `findContinueTarget` → the step at `index` is `current` when the kind is
`start` or `continue`; `rewatch` and `none` promote nothing (the module spec's "a finished module features
nothing"). The 23 existing `module-route` tests are the regression net and are not edited.

### 3. The course overview

`courseOverviewProgress` flattens the course (entries in module `sequence`, lessons in `sequence`), passes
the record's lesson id as `lastOpenedLessonId` only when the record names this course, and maps the result
to its `ContinueTarget` (module, lesson, lesson number). This is `course-overview-rings` task 1.5; its
spec delta already states the rule.

### 4. My learning

A client hook, `useCourseContinueTarget(level, lastLesson)`, runs `findContinueTarget` over the continued
course's slices (with completion marks and positions) and, when the target differs from the recorded video,
resolves the target's location (`courseSlug`, the module slug looked up from `level.modules`, `lessonId`)
with the existing `resolveContinueWatchingPanel`. `ResumePanel` and `CourseProgressList` receive that panel.
While either round-trip is pending the existing placeholder shows. When nothing is stored, My learning still
shows the start panel (unchanged).

*Alternative considered:* resolve every lesson title client-side — rejected, the catalog does not ship
titles and the server action already resolves a location.

### 5. Learning order in the catalog

`makeFindCourseCatalog` sorts each course's lessons by their module's `sequence`, then the lesson's
`sequence`, before mapping them to slices. The slice shape does not change.

### 6. Documentation

The `continue-target` capability is the written rule. `findContinueTarget`'s JSDoc names it as the single
source of truth and lists its callers; `deriveModuleRoute`, `courseOverviewProgress` and the My learning
hook carry `@see findContinueTarget`. The module spec's requirement refers to the capability instead of
restating the rule.

## Risks / Trade-offs

- [Two active changes touch the course overview's continue target] → `course-overview-rings` keeps its
  spec delta; this change only moves the implementation behind a shared function. Archive
  `course-overview-rings` first.
- [My learning may need a second server round-trip] → only when the target differs from the record; the
  placeholder already covers the wait.
- [Sorting the catalog changes an order other consumers might rely on] → the only consumers count or group
  slices by module (`countModuleLessons`, `useCourseWatchProgress`), which are order-independent.

## Testing strategy

- **Vitest unit** — `continue-target.test.ts`: every scenario of the capability (last opened unfinished,
  finished → next, nothing after → first gap, no record → furthest progress, partly watched furthest,
  untouched list → start, all finished → rewatch, empty → none), mirroring the style of
  `module-route.test.ts`. `module-route.test.ts` runs unchanged as the refactor's net.
  `course-overview-progress.test.ts` (already red for task 1.5). `find-course-catalog.test.ts`: slices in
  module-then-lesson order when the repository returns them shuffled.
- **Vitest component + RTL** — `use-course-continue-target` hook test with an injected resolver and seeded
  completion; `my-learning-view.test.tsx`: a finished recorded video makes Resume and the lead card open the
  next video.
- **Playwright e2e** — `e2e/one-click-navigation.spec.ts` (or a My learning spec): open a lesson, mark it
  complete, open My learning → Resume opens the next video; the course overview's continue tile agrees.
