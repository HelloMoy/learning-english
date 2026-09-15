## 1. Conflicts that need no new code

- [x] 1.1 Take `main`'s `progress-ring` component, tests and stories
- [x] 1.2 Keep `continue-watching` and `course-level-card` deleted (confirm nothing imports them)
- [x] 1.3 Keep this branch's `LessonProgressSlice` doc comment in `find-course-catalog.ts`

## 2. Callers on the shared ring

- [x] 2.1 `CourseProgressList`: the cards' rings fill to the module's share and keep their percentage label (TDD: list test asserting the fill covers a third of the circle and reads 33% first → move the cards onto `ProgressRing` with `size`/`fraction`/children)
- [x] 2.2 `LearnerCard`: the tooltip ring fills to the course share with the percentage as its label (TDD: card test asserting the tooltip ring's fill first → move the tooltip onto `ProgressRing`)

## 3. Verification

- [x] 3.1 Browser check of My learning cards and the learner card tooltip at 1440 and 390, including a 0% ring
- [x] 3.2 `pnpm verify` and the affected e2e specs (`home`, `one-click-navigation`, `mobile-viewport`, `course-overview`, `module-route`) in Chromium; commit the merge
