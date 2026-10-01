## 1. Course poster — Enroll opens the course page

- [x] 1.1 (TDD: test → impl) In `course-poster.test.tsx`, replace "WHEN Enroll is activated THEN the learner is enrolled at once AND it is saved" with a failing spec: **Enroll** on a joinable poster is a link whose `href` is `/courses/advanced-intermediate-course/about`. Then render the action in `JoinablePoster` as `Link` to `courseDetailPath(course)` with the same classes, icon and label.
- [x] 1.2 (TDD: test → impl) Add a failing spec: activating **Enroll** calls no `enrollInCourseAction` and leaves `learnerStore`'s `enrolledCourses` without the course. Remove the `enrollInCourse` call and its import from `course-poster.tsx`.
- [x] 1.3 (TDD: test → impl) Add a spec rendering the joinable poster in `es`: the link named **Inscribirme** points at the course page.
- [x] 1.4 Update the `CoursePoster` JSDoc `@remarks` (the **Joinable** reading no longer enrolls) and the `Joinable` story description in `course-poster.stories.tsx`.

## 2. Available courses view

- [x] 2.1 (TDD: test → impl) In `available-courses-view.test.tsx`, replace the specs "its poster reads Enrolled at once", "the enrollment is refused" and "the next-up bar leaves" with one: activating **Enroll** on the Advanced poster leaves the summary at `3 courses · you’re enrolled in 1` and the poster not marked Enrolled. Change the "every course is a joinable poster" assertion to three links named Enroll. Drop the `enrollInCourseAction` mock setup if nothing else uses it.
- [x] 2.2 Update the `AvailableCoursesView` JSDoc line saying "**Enroll** turns a poster at once".

## 3. End-to-end

- [x] 3.1 (TDD: test → impl) In `e2e/available-courses.spec.ts`, replace "WHEN the learner enrolls from a poster THEN it reads Enrolled AND stays after a reload" with the journey: Enroll on the Advanced poster opens `/en/courses/advanced-intermediate-course/about` with the Advanced course still not enrolled; **Enroll** on that page enrolls; back on `/en/courses` the Advanced poster reads Enrolled.
- [x] 3.2 Remove the spec "WHEN they enroll from a poster THEN the next-up bar leaves".
- [x] 3.3 Add the spec "WHEN the page is in Spanish THEN Inscribirme opens the Spanish course page": on `/es/courses`, **Inscribirme** on the Advanced poster opens `/es/courses/advanced-intermediate-course/about`. The component test cannot see the locale prefix, because `@/i18n/navigation` is mocked there.

## 4. Verification

- [x] 4.1 Check the joinable poster in the browser with Playwright MCP in `en` and `es`: Enroll opens the course page, and enrolling there works.
- [x] 4.2 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and `pnpm test:e2e e2e/available-courses.spec.ts`, and fix any failure.
