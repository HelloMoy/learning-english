## 1. Shared confetti burst

- [x] 1.1 Add `src/lib/cinema-confetti/cinema-confetti.ts` with `fireCinemaConfetti()`: lazy `canvas-confetti` import, the cinema golds, both corner bursts, `disableForReducedMotion`, every failure swallowed; JSDoc (TDD: test → impl)
- [x] 1.2 Make `celebrateLessonCompletion()` delegate to `fireCinemaConfetti()` and trim its test to the delegation (TDD: test → impl)

## 2. The start link

- [x] 2.1 Add `src/components/course-start-link/course-start-link.tsx`: the link to `useCourseContinueTarget`'s video with its **Start course** / **Continue where you left off** / **Watch again** label, `className`, `onClick` and `ref`; nothing for a course with no videos; JSDoc (TDD: test → impl)
- [x] 2.2 Move the three start labels to `Components.CourseStartLink` in `en`, `es` and `pt` (TDD: test → impl, covered by 2.1's locale cases)
- [x] 2.3 Make `CourseEnrollAction` render `CourseStartLink` for its enrolled branch, existing tests green (TDD: test → impl)
- [x] 2.4 Add `course-start-link.stories.tsx` (start, with progress, finished, Spanish)

## 3. The welcome dialog

- [x] 3.1 Add `Components.EnrollmentWelcomeModal` to `en`, `es` and `pt`: mark, title, description with and without a video, keep exploring, close (TDD: test → impl, covered by 3.2's locale cases)
- [x] 3.2 Add `src/components/modals/enrollment-welcome-modal/enrollment-welcome-modal.tsx`: poster, mark, title, description, `CourseStartLink`, **Keep exploring**, close control; JSDoc (TDD: test → impl)
- [x] 3.3 Close on `Escape`, on the close control and on **Keep exploring**, resolving the modal and calling `focusOnClose` (TDD: test → impl)
- [x] 3.4 Close itself when the course leaves `useEnrolledCourses()` (TDD: test → impl)
- [x] 3.5 Add `enrollment-welcome-modal.stories.tsx` (with poster, without poster, no videos, Spanish, Portuguese)

## 4. Wire it to Enroll

- [x] 4.1 Make `CourseEnrollAction`'s **Enroll** enroll, fire `fireCinemaConfetti()` once and show `EnrollmentWelcomeModal` with `focusOnClose` aimed at its own action (TDD: test → impl)
- [x] 4.2 Add `NiceModal.Provider` to the tests and stories of `CourseEnrollAction`, `CourseDetailHero`, `CourseEnrollCard`, `CourseEnrollBar` and `CourseDetailView` that activate **Enroll** (TDD: failing tests → fix)

## 5. End-to-end

- [x] 5.1 `e2e/course-detail-page.spec.ts`: enrolling opens the welcome; **Keep exploring** leaves the enrolled course page; **Start course** in the welcome opens the first video (TDD: test → impl already in place)
- [x] 5.2 Update the existing enrolling specs in `e2e/course-detail-page.spec.ts` and `e2e/available-courses.spec.ts` to close the welcome before asserting on the page (TDD: failing tests → fix) — only `course-detail-page` asserted on the page behind the dialog; `available-courses` navigates away after enrolling and passes unchanged

## 6. Verification

- [x] 6.1 Walk the `clean-code` checklist over every touched file
- [x] 6.2 Review the dialog in the browser with Playwright MCP: dark and light, desktop and phone width, `en` and `es`, confetti visible
- [x] 6.3 Run `pnpm verify` and the touched e2e specs (`course-detail-page`, `available-courses`)
