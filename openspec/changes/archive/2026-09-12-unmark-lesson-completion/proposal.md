## Why

Completion is currently a one-way door. Once a lesson is marked, the button disables
itself forever: a learner who tapped it by accident, or who wants to redo a lesson they
did not really absorb, has no way back except clearing site data. The closing card also
says the wrong thing to them — it still asks "Finished this lesson? Mark it complete and
keep going." over a lesson that is already complete, and then repeats "Marked complete"
twice, once inside the button and once in the status line below it.

## What Changes

- **The closing card speaks to the state it is in.** While the lesson is incomplete it
  keeps today's invitation; once complete, that copy becomes a plain "Lesson completed"
  statement and the duplicate status line below the button is gone.
- **Completion becomes reversible.** In the completed state the primary button is
  replaced by a discreet "Unmark" text action — no filled button, no disabled control —
  that a learner can reach and activate at any time.
- **Un-marking asks first.** Activating it opens a confirmation dialog that names the
  consequences: the lesson counts as pending again, the course and module progress
  meters drop, its mark disappears from the outline and lesson lists, and — because the
  finish threshold is a second producer of completion — watching it to the end again
  re-marks it. The dialog states that the saved playback position is not erased.
  Cancelling changes nothing.
- **The domain gains the inverse operation.** `ProgressTracker` gains `unmarkComplete`,
  implemented by both the in-memory and the `localStorage` adapters, behind a new
  `unmarkLessonComplete` use case and its Server Action — so the un-mark takes the same
  dual-write path the mark already takes and the two trackers cannot disagree.
- **`MarkAsCompleteButton` is renamed `LessonCompletionToggle`.** A component that also
  un-marks is no longer a "mark as complete button"; the old name would mislead every
  future reader. The rename carries its test and story with it.

## Non-goals

- No undo/redo history, no "recently unmarked" affordance, no bulk un-marking of a
  module or a course.
- No change to the finish-threshold rule that auto-completes a lesson on playback: it
  keeps working exactly as it does, including re-marking a lesson that was un-marked.
- No change to saved playback positions — un-marking never touches them.
- No change to the next-lesson row, the rail card, or the desktop layout of the closing
  card beyond the copy and the action it now holds.
- Completion stays per-device: this change does not add auth or cross-device sync.

## Capabilities

### New Capabilities

- `lesson-completion-toggle`: the two states of the lesson's completion control — the
  invitation and primary button while incomplete, the "Lesson completed" statement and
  the discreet un-mark action once complete — and the confirmation dialog that guards
  the un-mark.

### Modified Capabilities

- `lesson-progress`: the `ProgressTracker` adapter contract gains `unmarkComplete`, the
  client composition root gains the matching writer, and the completion/playback
  independence rule gains the un-mark direction.
- `course-platform-domain`: the use-case set gains `unmarkLessonComplete`, alongside
  `markLessonComplete`, with the same ephemeral-on-the-server semantics.
- `lesson-page`: the "Mark as complete button" requirement no longer describes a
  disabling, label-toggling control, and the colocated-component list carries the
  renamed `LessonCompletionToggle`.

## Impact

- `src/domain/ports/progress-tracker/progress-tracker.ts` — `unmarkComplete`.
- `src/domain/use-cases/unmark-lesson-complete/` — new use case and its error type.
- `src/adapters/persistence/in-memory/...` and
  `src/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/`
  — the new port method.
- `src/hooks/use-lesson-completion/use-lesson-completion.ts` — `unmarkLessonComplete`.
- `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/actions.ts`
  and `page.tsx` — the inverse Server Action, injected like the existing one.
- `src/domain/course-platform-deps` (wherever the use-case set is assembled) — the new
  use case joins it.
- `src/components/lesson-view/mark-as-complete-button/` → renamed
  `src/components/lesson-view/lesson-completion-toggle/` (implementation, test, story),
  owning both states and the invitation copy.
- `src/components/lesson-view/lesson-close-card/lesson-close-card.tsx` — the prompt moves
  into the toggle; the card keeps its chrome, divider and next-lesson row.
- `src/components/modals/unmark-lesson-modal/` — new NiceModal + shadcn `Dialog`.
- `src/components/lesson-view/index.ts` — barrel.
- `src/messages/{en,es,pt}.json` — `Components.LessonCompletionToggle` and
  `Components.UnmarkLessonModal`.
- `e2e/lesson-page.spec.ts` — the mark → unmark → confirm round trip in a real browser.
