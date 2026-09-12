## Context

Completion is written in two places on every mark: `markLessonComplete` through a Server
Action (the server's tracker is in-memory and nothing reads it back — it is the path
per-user progress will take when auth lands) and the browser `ProgressTracker` through
`markLessonComplete` in `use-lesson-completion`, which is the snapshot every surface
reads (`useCompletedLessons` → outline marks, lesson rows, module and course meters).

`MarkAsCompleteButton` owns that write, plus a `useTransition` and an `aria-live` status
line. It disables itself once complete, so the mark is permanent for the device.

The closing card built by `lesson-close-complete-and-continue` renders the invitation
copy above the button — which now reads wrong over a completed lesson — and the status
line under it duplicates the button's own label.

The `watch-progress` capability is a second producer of the same storage key: crossing
the finish threshold marks the lesson. That is why un-marking has to be described as
reversible-in-both-directions rather than as a delete.

## Goals / Non-Goals

**Goals:**

- One component owns the completion narrative and both of its states.
- Un-marking is possible, quiet, and confirmed, and writes both places the mark does.
- The domain gains a real inverse rather than the UI reaching into storage.
- The closing card says only what is true for the state it is in.

**Non-Goals:**

- Auth, cross-device sync, undo history, bulk operations.
- Touching playback positions or the finish-threshold rule.
- Redesigning the next-lesson row or the desktop layout.

## Decisions

### D1 — `MarkAsCompleteButton` becomes `LessonCompletionToggle`, and owns the copy

The folder `mark-as-complete-button/` is renamed `lesson-completion-toggle/` (component,
test, story), and the component renders both states, including the phone-only invitation
copy that the closing card renders today.

*Why:* a component that also un-marks is not a "mark as complete button" — the old name
would misdescribe it for every future reader. Moving the invitation into it puts the
whole state machine in one place: the card no longer needs to know whether the lesson is
complete, and there is exactly one component reading the completion snapshot for this
surface.

*Alternative rejected:* keeping the name and passing `completed` down to the card as a
prop so it can pick its copy. That leaves two components reading the same state and a
name that lies.

*Cost, accepted:* the `lesson-page` spec names the component in its colocation
requirement, so that requirement carries the rename.

### D2 — The un-mark is a text button, not a link and not a filled button

The completed state renders the statement and, under it, a `<button>` styled as a quiet
underlined text action (`min-h-11`, no primary surface).

*Why:* it changes state on this device — it is an action, not navigation, so it must not
be an `<a>`. The 44px floor is the project's tap-target rule; quiet styling does not
exempt a control from it.

### D3 — The dialog is a `NiceModal` + shadcn `Dialog`, resolved as a promise

`UnmarkLessonModal` lives in `src/components/modals/unmark-lesson-modal/` and is shown
with `await NiceModal.show(UnmarkLessonModal)`, resolving `true` on confirm and `false`
on cancel or dismiss. The toggle awaits that before writing anything.

*Why:* it is the project's documented modal pattern (`@ebay/nice-modal-react` + the
`Dialog` primitive, provider already mounted), and resolving a promise keeps the
decision in the caller: the toggle owns the write, the modal owns the question.

*Why a bespoke modal rather than a generic `ConfirmModal`:* the consequences are
specific — progress meters, the outline mark, the re-marking rule, the kept playback
position. A generic confirm would push that copy into the call site and lose it for the
next caller.

### D4 — The inverse goes through the port, the use case and the action

`ProgressTracker` gains `unmarkComplete(lessonId)`, implemented by
`InMemoryProgressTracker` and `BrowserLocalStorageProgressTracker`;
`unmarkLessonComplete` mirrors `markLessonComplete` (validate the lesson exists, write,
resolve `{ completed: false }`), joins the use-case set, and gets
`unmarkLessonCompleteAction` beside the existing action, injected into `LessonView` the
same way.

*Why:* the client store is written through the port by rule (`lesson-progress` §"The
client reads completion through a single composition root"), so the UI cannot clear a
key on its own; and leaving the server tracker marked while the browser says otherwise
would bake a drift into the path that becomes per-user progress under auth.

*Alternative rejected:* clearing only the browser store and skipping the Server Action.
Cheaper now, wrong the day the server tracker is the source of truth.

### D5 — The status line goes, but the announcement stays

The `aria-live` line that repeated the button's label is removed. The "Lesson completed"
statement takes over the announcement: it is the live region now.

*Why:* the visible duplication the learner complained about was the label rendered twice;
the announcement itself is what tells a screen-reader user the click worked. Deleting
both would have been a silent regression, so the live region moves rather than
disappears.

## Risks / Trade-offs

- **[A learner un-marks and immediately rewatches, and the finish threshold re-marks the
  lesson — looking like the un-mark failed]** → the dialog says so before they confirm;
  the spec records it as the existing rule applying unchanged rather than a bug to fix.
- **[The rename touches a component with heavy test coverage]** → the test and story move
  with the file and are updated in the same task; `pnpm verify` catches any missed
  import, and the barrel keeps the public name in one place.
- **[The modal's promise never resolves if the dialog is dismissed by the Escape key]** →
  the modal resolves `false` on every close path (cancel, Escape, overlay), and a test
  covers the dismiss path specifically.
- **[The server tracker is ephemeral, so a "successful" un-mark there proves little]** →
  accepted and already recorded in `course-platform-domain`; the test asserts the action
  is called, not that the server remembers.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Vitest unit | `src/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/browser-local-storage-progress-tracker.test.ts` (extend) | `unmarkComplete` removes the key, is idempotent, isolates other lessons, and no-ops when storage is missing or throws. Mirrors the existing `markComplete` cases. |
| Vitest unit | `src/adapters/persistence/in-memory/.../in-memory-progress-tracker.test.ts` (extend) | The same contract for the server adapter. |
| Vitest unit | `src/domain/use-cases/unmark-lesson-complete/unmark-lesson-complete.test.ts` (new) | Resolves `{ completed: false }`, is idempotent, errs `lesson-not-found` for an unknown lesson and writes nothing. Mirrors `mark-lesson-complete.test.ts`. |
| Vitest unit | `src/hooks/use-lesson-completion/use-lesson-completion.test.ts` (extend) | `unmarkLessonComplete` clears the mark and notifies every subscriber. |
| Vitest + RTL | `src/components/modals/unmark-lesson-modal/unmark-lesson-modal.test.tsx` (new) | The dialog names the four consequences, resolves `true` on confirm, `false` on cancel and `false` on Escape. |
| Vitest + RTL | `src/components/lesson-view/lesson-completion-toggle/lesson-completion-toggle.test.tsx` (renamed + extended) | Both states and their copy; no disabled control when complete; no duplicate status line; activating the un-mark opens the dialog and writes nothing; confirming calls the action and clears the store; cancelling changes nothing; a rejected action leaves the lesson complete. |
| Vitest + RTL | `src/components/lesson-view/lesson-close-card/lesson-close-card.test.tsx` (adjust) | The card no longer renders the invitation itself; it renders `children` and the next-lesson row as before. |
| Playwright | `e2e/lesson-page.spec.ts` (extend) | At 390px: mark → the completed state appears with an enabled, non-primary un-mark action ≥44px → activating it opens the dialog → cancelling keeps the mark → confirming returns the primary button and clears the outline's mark. |
| Storybook | `lesson-completion-toggle.stories.tsx`, `unmark-lesson-modal.stories.tsx` | Incomplete, Completed, and the dialog, reviewed in `en`/`es`/`pt`. |

Every task is TDD: the failing test named here is written before the production code it
describes, per `AGENTS.md`.
