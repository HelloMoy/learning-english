## 1. Routing and messages

- [x] 1.1 Add `courseDetailPath(course)` → `/courses/<slug>/about` to `src/i18n/lesson-routes.ts` (TDD: test in `lesson-routes.test.ts` → impl)
- [x] 1.2 Add `CourseCatalog.courseOverview.viewCourseDetails` and `Components.CourseEnrollCard.goToProgress` to `en`, `es`, `pt` (content only; exercised by the component tests below)

## 2. Seeded-store gate

- [x] 2.1 Add `useIsLearnerStoreSeeded` in `src/hooks/use-is-learner-store-seeded/` (TDD: false before seeding, true after → impl)
- [x] 2.2 Move the pending shape to `src/components/pending-course-page/` with a story and JSDoc; `CoursePageSwitch` uses it and the new hook (refactor under the existing `course-page-switch.test.tsx`, green before and after)
- [x] 2.3 Add `CoursePageGate({ title, children })` in `src/components/course-page-gate/` with JSDoc and a story (TDD: pending shape with the title as h1 before seeding, children after → impl)

## 3. Course progress tile and board

- [x] 3.1 `CourseProgressTile` takes `link?: { href; label }`: footer link with the label, heading text linked with `tabIndex={-1}`, nothing without `link` (TDD: tile tests → impl; update stories)
- [x] 3.2 `MyLearningView` passes `link={{ href: courseOverviewPath(course), label: t("viewCourse") }}` (TDD: View course still links to the overview and the title links there too → impl)
- [x] 3.3 `CourseProgressBoard` passes `link={{ href: courseDetailPath(course), label: t("viewCourseDetails") }}` (TDD: board links View course details to `/courses/<slug>/about`, also while pending → impl)

## 4. Course page

- [x] 4.1 `CourseEnrollCard` renders **Go to my progress** → `courseOverviewPath(course)` when enrolled, nothing otherwise (TDD: card tests → impl; update stories)
- [x] 4.2 Add `src/app/[locale]/courses/[courseSlug]/about/page.tsx`: metadata via `shareMetadata` with `href` `/courses/<slug>/about`, `CourseOverviewError` for bad or unknown slugs, `CoursePageGate` around `CourseDetailView`

## 5. End to end and visual check

- [x] 5.1 `e2e/course-detail-page.spec.ts`: enrolled learner goes board → **View course details** → `/about` (enrolled state, no ring tiles) → **Go to my progress** → board; an unknown slug under `/about` shows the error state (TDD: spec red before 3.3/4.2 land → green)
- [x] 5.2 Playwright MCP visual check of the board and `/about` in `es`, desktop and phone widths

## 6. Verification (first pass)

- [x] 6.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and `pnpm test:e2e e2e/course-detail-page.spec.ts e2e/course-overview.spec.ts`; all green

## 7. The enrolled action follows progress

- [x] 7.1 Add `continueWhereLeftOff` and `watchAgain` to `Components.CourseEnrollAction` in `en`, `es`, `pt`
- [x] 7.2 Add `useCourseContinueTarget(view)` in `src/hooks/use-course-continue-target/` (TDD: start / continue / rewatch / none → impl)
- [x] 7.3 `CourseEnrollAction` links the enrolled learner to that target with the matching label (TDD: action tests → impl; update stories)
- [x] 7.4 e2e: an enrolled learner with a finished first video sees **Continue where you left off** on `/about`, linking where the board's continue tile links (TDD: spec → green)

## 8. Verification

- [x] 8.1 Run `pnpm verify` and the course e2e specs again; visual check of `/about` with progress in `es`
