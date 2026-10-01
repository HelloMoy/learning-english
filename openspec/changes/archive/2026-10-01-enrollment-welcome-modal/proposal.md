## Why

Enrolling from the course page is the moment a learner commits to a course, and today nothing
marks it: the **Enroll** button silently turns into **Start course** and the hero's mark changes
its word. A learner who joins deserves to be told they are in, and to be handed the first video
while the decision is fresh — the same instinct the prize dialogs already follow.

## What Changes

- Activating **Enroll** on the course page opens a **welcome dialog**: the poster of the video the
  course starts with, an **Enrolled** mark, the title **You’re in!**, a line naming the course and
  that video with its duration, and two ways on.
- The dialog's primary action is the page's own enrolled action — **Start course**, **Continue
  where you left off** or **Watch again** — opening the same video. **Keep exploring** closes the
  dialog and leaves the learner on the course page, now in its enrolled state.
- The dialog opens with the confetti burst that celebrates finishing a video: the same burst, with
  the same reduced-motion and on-demand-loading rules.
- If the server refuses the enrollment, the dialog closes on its own as the page offers **Enroll**
  again.
- The enrolled branch of the enroll action becomes its own component, so the page and the dialog
  render the same link from one place.
- The confetti burst moves to a shared helper that both the lesson celebration and the enrollment
  welcome call.

## Capabilities

### New Capabilities

- `enrollment-welcome`: the dialog and confetti a learner gets on enrolling from the course page —
  when it opens, what it shows, its two actions, how it closes, and what happens when the
  enrollment is refused.

### Modified Capabilities

None. `course-detail-page` keeps every requirement: the enroll actions still flip to **Start
course** at once and still withdraw on refusal. `lesson-completion-celebration` keeps its burst,
its triggers and its loading rule; only where the burst's code lives changes.

## Non-goals

- No welcome when a learner is enrolled by **opening a lesson**, or by the onboarding's
  first-course step: those flows already land the learner inside the course.
- No welcome on a later visit to a course the learner is already enrolled in.
- No change to how enrollment is stored, to the enroll action's optimistic behavior, or to the
  server action.
- No new confetti look: the enrollment burst is the lesson-completion burst.
- No change to the progress board, Available courses, or My learning.

## Impact

- **New**: `src/components/modals/enrollment-welcome-modal/`, `src/components/course-start-link/`,
  `src/lib/cinema-confetti/`, each with tests, and stories for the two components.
- **Changed**: `src/components/course-enroll-action/` (opens the dialog, fires the burst, delegates
  its enrolled branch), `src/lib/celebrate-completion/` (delegates the burst),
  `src/messages/{en,es,pt}.json` (new `Components.EnrollmentWelcomeModal`; the three start labels
  move to `Components.CourseStartLink`).
- **Tests**: unit tests of the components that render the enroll action now mount
  `NiceModal.Provider`; `e2e/course-detail-page.spec.ts` and `e2e/available-courses.spec.ts`
  enroll through the dialog, and the dialog gets its own e2e coverage.
- **Dependencies**: none added — `canvas-confetti`, `@ebay/nice-modal-react` and the `Dialog`
  primitive are already in the project.
