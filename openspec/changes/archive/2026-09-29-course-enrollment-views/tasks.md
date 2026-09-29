## 1. Pure logic and data loading

- [x] 1.1 `courseShelf` in `src/lib/course-shelf/`: featured by latest record, fallback to first enrolled by sequence, other enrolled in sequence, available in sequence, per-course location feeding `courseOverviewProgress`, records of non-enrolled courses ignored, `isCompleted` (TDD: test → impl)
- [x] 1.2 `loadCourseViews()` in `src/app/[locale]/course-views.ts` (cached): every catalog course's `CourseForView` in sequence order, empty on failure (TDD: test → impl)

## 2. Adjust existing pieces

- [x] 2.1 `OnboardingProgress` counts three steps (TDD: test → impl)
- [x] 2.2 `useOnboardingDestinations().afterOnboarding` → `/start/first-course` (course `next` unchanged); avatar step test expects it (TDD: test → impl)
- [x] 2.3 `CourseProgressTile`: `headingLevel` (`h1` default, `h2`) and optional `href` rendering a **View course** link; story variants (TDD: test → impl)
- [x] 2.4 `CourseProgressBoard` uses its own course's record from the per-course list; repository prop reads `list()` (TDD: test → impl)
- [x] 2.5 `SiteHeader`: **Courses** menu item between My learning and Achievements; `sectionKey("/courses")` → `sectionCourses`; messages in en/es/pt (TDD: test → impl)

## 3. New components (each: test, story, JSDoc, `Components.<Name>` in en/es/pt)

- [x] 3.1 `CourseCinemaHero` (last watched / your course / recommended variants, resume chip, figures, prizes, CTA kinds) (TDD: test → impl)
- [x] 3.2 `EnrolledCourseCard` (progress, next up, Continue; Completed with prizes and Watch again) (TDD: test → impl)
- [x] 3.3 `CourseShelfCard` (thumbnails strip with "+K", figures, Enroll calls `enrollInCourse`, Preview course link) (TDD: test → impl)
- [x] 3.4 `ResumeTile` (marks, eyebrow, progress bar with m:ss / m:ss, relative "watched" time, CTA kinds, pending placeholder) (TDD: test → impl)
- [x] 3.5 `EnrolledCourseSummaryCard` (ring, figures, next up row, Continue / View course, current border) (TDD: test → impl)

## 4. Views and routes

- [x] 4.1 `AvailableCoursesView` + `src/app/[locale]/courses/page.tsx` (metadata, summary plural, three sections, empty-enrollment recommendation, optimistic enroll moves the card, pending placeholders) (TDD: test → impl)
- [x] 4.2 `FirstCourseStep` + `src/app/[locale]/start/first-course/page.tsx` (hero, What you'll learn, Start enrolls and navigates, See all courses, step indicator hidden with `from=learning`, no-profile redirect) (TDD: test → impl)
- [x] 4.3 Rewrite `MyLearningView` (greeting, `ResumeTile` + `CourseProgressTile` h2 with View course, Your courses cards, Browse courses, empty-enrollment redirect to `/start/first-course?from=learning`); `learning/page.tsx` passes course views (TDD: test → impl)
- [x] 4.4 Delete `ResumePanel`, `StartPanel`, `CourseProgressList`, `useCourseContinueTarget` (with tests/stories) and messages only they used; `pnpm typecheck` / `pnpm lint` clean

## 5. Visual check

- [x] 5.1 Storybook: every new/changed story renders in en/es/pt and in both themes — checked with Playwright MCP
- [x] 5.2 Dev server: `/courses`, `/start/first-course`, `/learning` at desktop and 390px checked with Playwright MCP against the chosen designs

## 6. End to end

- [x] 6.1 Fixtures: `learnerState.enrolled(courseSlugs)`; `onboardedLearner` / specs that open My learning seed a Basic enrollment
- [x] 6.2 Update onboarding e2e (`home.spec.ts`, `course-onboarding-gate.spec.ts`): finishing step 2 opens step 3; Start opens the first video enrolled; See all courses opens `/courses`; `/learning` without enrollment lands on step 3 without the indicator (TDD: test → impl)
- [x] 6.3 New `available-courses.spec.ts`: last watched featured; enroll from the shelf survives reload; header menu Courses link (TDD: test → impl)
- [x] 6.4 My learning e2e: resumes the last watched course and lists both enrolled courses (TDD: test → impl)

## 7. Verification

- [x] 7.1 `pnpm verify` green
- [x] 7.2 `pnpm test:e2e` (chromium, `--workers=1`) for the touched specs plus `learner-progress-sync`, `achievements`, `one-click-navigation`, `learner-account`, `account-deletion` against the local dev server
