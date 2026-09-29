## 1. Domain values and ports

- [x] 1.1 `ContinueWatchingRecord` entity in `src/domain/entities/continue-watching-record/` (valid parse, negative `watchedAt` rejected) (TDD: test → impl)
- [x] 1.2 `CourseEnrollmentRepository` port in `src/domain/ports/course-enrollment-repository/` with JSDoc; add `list()` to `ContinueWatchingRepository` and update its JSDoc to "one location per course" (types only; covered by the adapter tests below)
- [x] 1.3 `InMemoryCourseEnrollmentRepository` (idempotent enroll, empty list) mirroring `in-memory-prize-claim-repository` (TDD: test → impl)

## 2. Use cases

- [x] 2.1 `enrollInCourse` + `enroll-in-course.errors.ts`: ok, `course-not-found`, `internal-error` (TDD: test → impl)
- [x] 2.2 `recordContinueWatching`: enrolls then stores; unknown course writes neither; storage failure is `internal-error` (TDD: test → impl)

## 3. Database

- [x] 3.1 Add `courseEnrollment` to `learner-schema.ts` and `LEARNER_TABLES`; re-key `continueWatching` to `(userId, courseSlug)`; extend `schema.test.ts` cascade expectations (TDD: test → impl)
- [x] 3.2 `pnpm db:generate` for the schema migration; inspect the generated SQL keeps rows through the `continue_watching` rebuild
- [x] 3.3 Test that a `continue_watching` row written before the re-key survives it (run migrations up to the previous one on a container, insert, apply the rest) (TDD: test → impl)
- [x] 3.4 `drizzle-kit generate --custom --name=enroll-existing-learners` and fill it with the two `INSERT OR IGNORE` statements; integration test runs the file's statements against users with and without Advanced locations, twice (TDD: test → impl)

## 4. Turso adapters

- [x] 4.1 `TursoCourseEnrollmentRepository` (idempotent, isolated, corrupt slug skipped, cascade) (TDD: test → impl)
- [x] 4.2 Rewrite `TursoContinueWatchingRepository` per course: `get()` latest by `updated_at`, `list()` most recent first with `watchedAt`, per-course replace, corrupt rows skipped (TDD: test → impl)
- [x] 4.3 Wire `enrollments` into `createLearnerRepositories` and `getLearnerDependencies` (use cases `enrollInCourse`, `recordContinueWatching`)
- [x] 4.4 `loadLearnerSnapshot` returns `continueWatching: ContinueWatchingRecord[]` and `enrolledCourseSlugs`; update `LearnerSnapshot` and `EMPTY_LEARNER_SNAPSHOT` (TDD: test → impl)

## 5. Server Actions

- [x] 5.1 `LEARNER_ACTION_SCHEMAS.courseEnrollment = { courseSlug: Slug }`; `enrollInCourseAction`; `recordContinueWatchingAction` runs `recordContinueWatching` and returns `{ recorded: result.isOk() }`; no learner id in any schema (TDD: test → impl)
- [x] 5.2 Add `enrollInCourseAction` to `src/test-setup/mocks/learner-actions.ts`

## 6. Client store and hooks

- [x] 6.1 `LearnerState.continueWatching` becomes `ReadonlyArray<ContinueWatchingRecord>`, add `enrolledCourses`; `stateOf` / seed; update `src/test-setup/learner-store/` helpers (`continueWatching(location)` keeps its signature and builds a one-record list; add `enrolledCourses(...)`) (TDD: test → impl)
- [x] 6.2 `LearnerStoreContinueWatchingRepository`: `get()` from the head, `list()`, `set()` moves the course to the head with `watchedAt: Date.now()` and adds the enrollment, both rolled back together on refusal (TDD: test → impl)
- [x] 6.3 Client `enrollInCourse(courseSlug)` in `use-enrolled-courses` (skip when enrolled, optimistic, rollback), following `claimPrize` — no learner-store port adapter, as prize claims have none (TDD: test → impl)
- [x] 6.4 `useEnrolledCourses()` and `useContinueWatchingByCourse()` with empty server snapshots (TDD: test → impl)
- [x] 6.5 Fix any remaining type errors from the store shape change (`pnpm typecheck`) without changing the behavior of current readers of `get()`

## 7. End to end

- [x] 7.1 Extend `e2e/learner-state-fixture.ts` with reading enrollments; e2e: a fresh account opens an Advanced lesson, reloads, and is enrolled in that course while its Basic place (if seeded) is kept (TDD: test → impl)

## 8. Verification

- [x] 8.1 `pnpm verify` (typecheck, format, lint, `pnpm test:run`) green
- [x] 8.2 `pnpm test:e2e` for `learner-progress-sync`, `course-onboarding-gate`, `lesson-playback-resume` and the new spec (chromium, `--workers=1` to separate flakes) against the local dev server
