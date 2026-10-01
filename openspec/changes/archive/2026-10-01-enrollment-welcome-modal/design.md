## Context

The course page's one action is `CourseEnrollAction`, rendered three times (hero, enroll card,
bottom bar). Not enrolled, it is a button that calls `enrollInCourse(slug)` — a fire-and-forget
optimistic write: the learner store gains the course synchronously and loses it again if the server
refuses. Enrolled, it is a link to the video `useCourseContinueTarget` picks.

Celebration already exists in two shapes. Modals are opened imperatively through
`@ebay/nice-modal-react` over the project `Dialog` (`PrizeReadyModal`, `PrizeRedeemedModal`). The
confetti is `celebrateLessonCompletion()` in `src/lib/celebrate-completion`, which lazily imports
`canvas-confetti`, fires two corner bursts in the cinema golds and swallows every failure.

The visual direction was chosen from a design exploration (the "recommended" variant): poster of
the first video on top, the hero's **Enrolled** pill, a centred title and description, a full-width
primary action and a text secondary.

## Goals / Non-Goals

**Goals:**

- A welcome dialog on enrolling from the course page, with the lesson-completion confetti.
- The dialog's primary action can never disagree with the page's enrolled action.
- A refused enrollment never leaves a congratulation on screen.

**Non-Goals:**

- Changing `enrollInCourse`, the server action or how enrollment is stored.
- Welcoming enrollments that happen by opening a lesson or in onboarding.
- A new confetti look, or new motion keyframes in `globals.css`.

## Decisions

### D1. The dialog opens optimistically, and closes itself on a refusal

`CourseEnrollAction`'s click does three things in order: `enrollInCourse(slug)`, fire the burst,
`NiceModal.show(EnrollmentWelcomeModal, …)`. The modal reads `useEnrolledCourses()` and, when the
course is no longer in it, closes.

*Alternative — wait for the server's answer.* It would never congratulate a refused enrollment, but
`enrollInCourse` returns nothing, so it means changing a shared API, and it opens a race: a learner
who clicks **Start course** before the answer arrives would get the dialog on the lesson page. The
page itself already flips optimistically; a dialog that lags behind it would be the odd one out.
The cost of the chosen path is a burst and a half-second dialog on the rare refusal.

### D2. The enrolled link is extracted as `CourseStartLink`

The dialog needs the page's enrolled action — same label, same destination — plus an `onClick` to
close itself. Rendering `CourseEnrollAction` inside the dialog would also render its **Enroll**
branch during a rollback, and that button would open a second welcome. So the enrolled branch
becomes `src/components/course-start-link/course-start-link.tsx` (`view`, `className`, `onClick`,
`ref`), `CourseEnrollAction` delegates to it, and the dialog renders it directly. Its three labels
move to `Components.CourseStartLink`, following the one-namespace-per-component rule.

*Alternative — duplicate the link in the modal.* Two copies of the label mapping and the action
classes that would have to be kept equal by hand; the spec says they must agree.

### D3. The burst moves to `src/lib/cinema-confetti`

`fireCinemaConfetti()` owns the lazy import, the colours, the two bursts and the swallow-all
`try/catch`. `celebrateLessonCompletion()` stays as the lesson capability's name for it and
delegates, so its three callers and their mocks are untouched. The enroll action calls
`fireCinemaConfetti()` directly.

*Alternative — call `celebrateLessonCompletion()` from the enroll action.* Works, but the name
would lie at the call site.

The burst is fired from the click handler, not from an effect in the modal: an effect would fire
twice under React Strict Mode and would need a guard, and the handler is the one place that knows
an enrollment was just requested. `canvas-confetti` draws on its own canvas at `z-index: 100`,
above the dialog's `z-50` scrim, with `pointer-events: none`.

### D4. Focus returns to the action the learner activated

The **Enroll** button is unmounted the moment the store flips — React replaces it with the start
link — so Radix's default "return focus to the trigger" would drop focus on `<body>`.
`CourseEnrollAction` keeps one ref on whichever element it renders and passes
`focusOnClose: () => ref.current?.focus()` to the modal, which calls it from `onCloseAutoFocus`.
After a refusal the ref points at the new **Enroll** button, so the same call is right there too.

### D5. Layout on the existing `Dialog`

`DialogContent` with `p-0`, `border-primary/45` and a 30rem cap. The poster is a `next/image` in a
16:9 box fading into `card`; it is decoration (`alt=""`, `aria-hidden`). The built-in close button
is replaced (`showCloseButton={false}`) by a `DialogClose` on a translucent disc, because the stock
one is muted text with no backing and sits on the poster. The mark's entrance uses the
`tw-animate-css` utilities already loaded; the global reduced-motion rule stills it.

## Testing strategy

- **Vitest unit** — `cinema-confetti.test.ts` takes over the four cases of
  `celebrate-completion.test.ts` (fires, `disableForReducedMotion`, a throw and a rejection are
  swallowed); `celebrate-completion.test.ts` shrinks to "delegates to the shared burst".
- **Vitest component + RTL**
  - `course-start-link.test.tsx` inherits the enrolled cases of `course-enroll-action.test.tsx`
    (start / continue / watch again / no video / `es` / `pt`) and adds `onClick`.
  - `enrollment-welcome-modal.test.tsx` mirrors `prize-ready-modal.test.tsx` (a `NiceModal.Provider`
    with a registered modal and an `open` button): name and description, poster present / absent,
    no-video course, primary link label and `href`, **Keep exploring** and `Escape` close and call
    `focusOnClose`, closes itself when the enrollment is withdrawn, `es` and `pt` copy.
  - `course-enroll-action.test.tsx`: **Enroll** opens the dialog and fires the burst once
    (`cinema-confetti` mocked, as the lesson tests mock `celebrate-completion`); a refusal closes
    the dialog; an enrolled render opens nothing.
  - The tests of `CourseDetailHero`, `CourseEnrollCard`, `CourseEnrollBar` and `CourseDetailView`
    that activate **Enroll** gain a `NiceModal.Provider` wrapper.
- **Playwright e2e** — `e2e/course-detail-page.spec.ts`: enrolling opens the dialog; **Keep
  exploring** leaves the enrolled course page; **Start course** in the dialog opens the first
  video. The two existing specs that enroll (`course-detail-page`, `available-courses`) close the
  dialog before asserting on the page behind it.

## Risks / Trade-offs

- [A refused enrollment still gets a burst and a flash of dialog] → accepted (D1); refusals are
  rare and the dialog withdraws itself.
- [Every test that clicks **Enroll** now needs `NiceModal.Provider`] → wrap in the tests that
  click; the app always has the provider through `global-providers.tsx`.
- [The dialog covers the page for e2e role queries] → the affected specs dismiss it first.
- [A poster from an arbitrary video may be busy] → nothing but the close control sits on it; mark,
  title and copy are on the card below.
- [Moving three message keys] → `Components.CourseEnrollAction` keeps only `enroll`; no other
  component reads the moved keys.
