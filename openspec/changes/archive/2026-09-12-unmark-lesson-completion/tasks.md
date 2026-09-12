## 1. The port and its adapters

- [x] 1.1 Write the failing adapter tests for `unmarkComplete` in `browser-local-storage-progress-tracker.test.ts`: it removes the key, is idempotent, leaves other lessons complete, and no-ops when `localStorage` is absent or throws (TDD: test → impl)
- [x] 1.2 Add `unmarkComplete` to the `ProgressTracker` port and implement it in `BrowserLocalStorageProgressTracker` (TDD: impl follows 1.1)
- [x] 1.3 Write the failing test for `InMemoryProgressTracker.unmarkComplete` (same contract) (TDD: test → impl)
- [x] 1.4 Implement it in `InMemoryProgressTracker` (TDD: impl follows 1.3)

## 2. The use case and its Server Action

- [x] 2.1 Write the failing `unmark-lesson-complete.test.ts`: resolves `{ completed: false }`, is idempotent, and errs `lesson-not-found` without writing (TDD: test → impl)
- [x] 2.2 Implement `src/domain/use-cases/unmark-lesson-complete/` (use case + errors), mirroring `mark-lesson-complete` (TDD: impl follows 2.1)
- [x] 2.3 Register `unmarkLessonComplete` in the use-case set assembled by the composition root, and add `unmarkLessonCompleteAction` beside `markLessonCompleteAction` with the same Zod input schema (no TDD: wiring, covered by 2.1 and the component tests through the injected action)

## 3. The client composition root

- [x] 3.1 Write the failing test in `use-lesson-completion.test.ts`: `unmarkLessonComplete` clears the mark and every subscriber sees it (TDD: test → impl)
- [x] 3.2 Implement `unmarkLessonComplete` in `use-lesson-completion.ts`, writing through the tracker and refreshing the shared snapshot (TDD: impl follows 3.1)

## 4. The confirmation dialog

- [x] 4.1 Add the `Components.UnmarkLessonModal` namespace (title, the consequences body, confirm, cancel) to `src/messages/{en,es,pt}.json` (no TDD: message data)
- [x] 4.2 Write the failing `unmark-lesson-modal.test.tsx`: the dialog names the consequences (progress meters, outline mark, re-marking on rewatch, kept playback position) and resolves `true` on confirm (TDD: test → impl)
- [x] 4.3 Implement `src/components/modals/unmark-lesson-modal/unmark-lesson-modal.tsx` with `NiceModal.create` + the `Dialog` primitive (TDD: impl follows 4.2)
- [x] 4.4 Write the failing tests for the cancel and Escape paths — both resolve `false` (TDD: test → impl)
- [x] 4.5 Wire both close paths to resolve `false` (TDD: impl follows 4.4)
- [x] 4.6 Add JSDoc and `unmark-lesson-modal.stories.tsx`

## 5. The completion toggle

- [x] 5.1 Rename `src/components/lesson-view/mark-as-complete-button/` to `lesson-completion-toggle/` with `git mv` (component, test, story), rename the export to `LessonCompletionToggle`, and update the barrel, `lesson-view.tsx` and the story title — keeping every existing test green (no TDD: pure rename, the moved tests are the guard)
- [x] 5.2 Add the `Components.LessonCompletionToggle` namespace (the invitation moved from `LessonCloseCard`, the "Lesson completed" statement, the un-mark label) to `src/messages/{en,es,pt}.json`, and remove `Components.LessonCloseCard.prompt` (no TDD: message data)
- [x] 5.3 Write the failing test for the incomplete state: the toggle renders the invitation copy and the primary button (TDD: test → impl)
- [x] 5.4 Move the invitation into the toggle, keeping it phone-only, and drop it from `LessonCloseCard` (adjusting that component's test) (TDD: impl follows 5.3)
- [x] 5.5 Write the failing test for the completed state: the statement renders in an `aria-live` region, no invitation, no duplicate status line, and nothing is disabled (TDD: test → impl)
- [x] 5.6 Implement the completed state (TDD: impl follows 5.5)
- [x] 5.7 Write the failing test for the un-mark action: it is an enabled, non-primary control with a ≥44px target and an accessible name, and activating it opens the dialog without writing anything (TDD: test → impl)
- [x] 5.8 Implement the un-mark action and its `NiceModal.show` call (TDD: impl follows 5.7)
- [x] 5.9 Write the failing tests for the outcomes: confirming calls the Server Action and clears the browser store; cancelling changes nothing; an action that resolves without `data` leaves the lesson complete (TDD: test → impl)
- [x] 5.10 Implement the confirm/cancel handling inside the existing transition (TDD: impl follows 5.9)
- [x] 5.11 Update the JSDoc and the story (`Incomplete`, `Completed`) for the renamed component

- [x] 5.12 The undo sits *beside* the statement, not under it, as the capability already requires ("a quiet text action beside the statement"): one row, the statement on the left and the undo pushed to the right edge (TDD: test → impl)

## 6. Browser behaviour

- [x] 6.1 Write the failing Playwright assertions in `e2e/lesson-page.spec.ts` at 390px: mark → completed state with an enabled, non-primary un-mark action ≥44px → activating opens the dialog → cancel keeps the mark → confirm restores the primary button and clears the outline's completion mark (TDD: test → impl)
- [x] 6.2 Verify the flow in a real browser at 390px in `en` / `es` / `pt` (Playwright MCP, or a scripted run if the MCP browser is held by another session) — the states read correctly, the dialog fits the viewport, and the page does not scroll sideways

## 7. Verification

- [x] 7.1 Run `pnpm verify` and fix every failure at its root
- [x] 7.2 Run the touched e2e specs (`e2e/lesson-page.spec.ts`, `e2e/watch-progress.spec.ts`) against the running dev server with `--workers=1`, and fix every failure
