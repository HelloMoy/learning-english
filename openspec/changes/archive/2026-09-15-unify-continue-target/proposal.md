## Why

"Which video should the learner continue with?" is answered in four places, and they disagree. The
module overview follows a careful rule — anchor on the last opened video, move past it when it is
already finished — but that rule lives privately inside `deriveModuleRoute`. The course overview's
continue tile, My learning's **Resume** panel and My learning's **Continue** lesson card all send the
learner to the raw continue-watching record, so a learner who just finished a video is offered that same
finished video again. The rule is also documented only as a module-overview requirement, so nothing tells
the next contributor that other surfaces must follow it.

## What Changes

- Extract the rule into one pure function, `findContinueTarget`, in `src/lib/continue-target/` — the
  single source of truth for the video to continue — with JSDoc stating that every continue surface uses it.
- Specify the rule once, as a new `continue-target` capability, over any ordered list of videos (one module
  or a whole course).
- `deriveModuleRoute` delegates its current-step choice to `findContinueTarget`; the module overview's
  behavior does not change.
- The course overview's continue tile uses `findContinueTarget` over the whole course (the rule the
  `course-overview-rings` change already specifies).
- **BREAKING (behavior)**: My learning's **Resume** panel and the lead lesson card's **Continue** action open
  the continue target of the continued course instead of the recorded video: a finished recorded video
  continues with the next unfinished one.
- The course catalog lists each course's lesson progress slices in learning order (module `sequence`, then
  lesson `sequence`), so My learning can apply the rule; today they arrive in repository order.
- The lesson page's **Up next** (the video after the one open) is documented as a different concept and
  stays as it is.

## Capabilities

### New Capabilities

- `continue-target`: the rule that picks the video a learner continues with from an ordered list of videos,
  the learner's progress and the last opened video.

### Modified Capabilities

- `cinema-module-overview`: "The current lesson is featured on the route" defers its rule to
  `continue-target`; presentation and scenarios are unchanged.
- `my-learning`: "My learning resumes the last lesson or starts the first" and "Lesson progress is listed as
  lesson cards" offer the continue target instead of the recorded lesson.
- `continue-watching`: "My learning offers to continue the last lesson" offers the continue target.

## Non-goals

- Changing the lesson page's **Up next** or the course navigator (they answer "what follows this video",
  not "where should I continue").
- Changing how completion is decided (`countsAsComplete`) or how the continue-watching record is stored
  or resolved on the server.
- Changing the module overview's featured card, its copy or its layout.
- Syncing progress across devices.
- Editing `AGENTS.md`; the rule is documented in the capability spec and in JSDoc.

## Impact

- New `src/lib/continue-target/continue-target.ts` (+ tests).
- `src/lib/module-route/module-route.ts` — current-step selection delegated; existing tests stay green.
- `src/lib/course-overview-progress/course-overview-progress.ts` — continue target through the shared rule
  (task 1.5 of `course-overview-rings`).
- `src/domain/use-cases/find-course-catalog/find-course-catalog.ts` — slices in learning order (+ test).
- My learning: `src/components/my-learning-view/my-learning-view.tsx` and a hook that turns the continued
  course into its continue target and resolves that location; `ResumePanel` and `CourseProgressList`
  receive the target.
- Specs: new `continue-target`; deltas to `cinema-module-overview`, `my-learning`, `continue-watching`.
- E2E: a My learning case where the recorded video is finished.
