## Context

Learner state lives in Turso (libSQL) behind domain ports (`learner-state`). The locale layout loads one
snapshot per request, a zustand store adopts it in the browser, and every write goes through an
authenticated Server Action with optimistic update and rollback (`writeThrough`).

`continue_watching` is keyed by `user_id` alone, so the port is a single slot: opening a lesson in the
Advanced course erases where the learner was in the Basic course. About thirty files read that slot
through `ContinueWatchingRepository.get()`: My learning, achievements, the course progress board and the
module route. There is no notion of enrollment anywhere.

Production has only served the Basic Course. The Advanced course was a draft until the latest release.
The follow-up change (`course-enrollment-views`) will build the onboarding recommendation, the Available
courses page and the new My learning on top of what this change stores.

## Goals / Non-Goals

**Goals:**

- Persist per account which courses a learner is enrolled in, with an idempotent enroll write.
- Enroll a learner the moment they open any lesson of a course.
- Keep one resume location per course with the time it was last written, and still answer "the last
  location" for every current reader without touching them.
- Enroll every pre-existing account in the Basic Course once, at migration time.

**Non-Goals:**

- Any screen change, redirect or copy (follow-up change).
- Leaving a course, enrollment dates in the UI, completion dates.
- Enrollment for signed-out visitors.

## Decisions

### D1. Enrollment is keyed by course slug, not course id

`course_enrollment (user_id, course_slug, enrolled_at)` with primary key `(user_id, course_slug)` and
`ON DELETE CASCADE` to `user`.

- **Why:** `continue_watching.course_slug` and `prize_claim.module_slug` already key learner rows by slug,
  and every route and Server Action speaks slugs. Mixing ids would force a lookup on every write.
- **Alternative:** the manifest's course uuid. It is more stable across renames, but a slug rename would
  already orphan `continue_watching` and `prize_claim` rows, so an id here buys nothing on its own.

### D2. The port mirrors `PrizeClaimRepository`

```ts
interface CourseEnrollmentRepository {
  list(): Promise<ReadonlySet<Slug>>;
  enroll(courseSlug: Slug): Promise<void>; // idempotent
}
```

Turso adapter (`onConflictDoNothing`) and in-memory adapter. The client needs no port adapter: like prize
claims, it reads and writes enrollments through a hook module (D5). The factory `createLearnerRepositories` builds the Turso one, so it stays the single place
that names Turso adapters.

### D3. `enrollInCourse` validates the course; recording a location enrolls through it

- `enrollInCourse({ courseSlug })` resolves the course through `CourseRepository.bySlug` and returns
  `err({ kind: "course-not-found" })` for an unknown or hidden (draft) course, so a forged request cannot
  enroll anyone in a slug the catalog does not serve.
- `recordContinueWatching(location)` runs `enrollInCourse(location.courseSlug)` and then
  `continueWatching.set(location)`. When the course is unknown, nothing is written.
- `recordContinueWatchingAction` switches from calling the repository directly to this use case, and a
  new `enrollInCourseAction({ courseSlug })` exposes the explicit enroll.
- **Why here and not in a lesson-page hook:** the server is the only place that sees every lesson visit,
  including ones whose optimistic client write races a navigation. Enrollment then cannot drift from the
  recorded locations.
- **Alternative:** a separate `enroll` call from the lesson page. That would double the requests per
  lesson visit and could fail independently.

### D4. `continue_watching` gets one row per course; the port keeps `get()` as "the latest"

- Primary key becomes `(user_id, course_slug)`. `updated_at` (already set by SQLite) orders the rows.
- `set(location)` upserts that course's row and refreshes `updated_at`, so it becomes the latest.
- `get()` returns the location with the greatest `updated_at`. That keeps the old contract, so every
  current reader is untouched.
- New `list(): Promise<ReadonlyArray<ContinueWatchingRecord>>` returns one record per course, most recent
  first. `ContinueWatchingRecord` is a domain value: `{ location: ContinueWatchingLocation, watchedAt:
  number }`, with epoch milliseconds read from storage. The domain still never calls a clock; the value
  is data.
- **Alternative:** a second table `course_resume` next to the single slot. Two sources of truth for
  "where was I" would disagree the first time one write fails.

### D5. Store shape: the per-course list replaces the single location

`LearnerState.continueWatching` changes from `ContinueWatchingLocation | null` to
`ReadonlyArray<ContinueWatchingRecord>` (most recent first), and `LearnerState` gains
`enrolledCourses: ReadonlySet<string>`. The learner-store continue-watching adapter derives `get()` from
the head of the list.

`set(location)` writes through in one optimistic step:

1. It moves or inserts that course's record at the head with `watchedAt: Date.now()`. That clock is
   allowed because this is an adapter, not the domain.
2. It adds the course to `enrolledCourses`.
3. It rolls back both slices together when the action is refused.

`LearnerSnapshot` mirrors this: `continueWatching: ContinueWatchingRecord[]` and
`enrolledCourseSlugs: string[]`.

A client function `enrollInCourse(courseSlug)` and a hook `useEnrolledCourses()` follow the
`claimPrize` / `useClaimedPrizes` pattern: skip when already enrolled, optimistic write, then
`enrollInCourseAction`, rolling back on refusal. `useEnrolledCourses()` returns an empty set on the
server and before hydration. `useContinueWatchingByCourse()` exposes the list the same way.

### D6. Existing accounts are enrolled by a custom SQL migration

Migrations are applied in order:

1. `drizzle-kit generate` produces the schema migration. It creates `course_enrollment`, and it rebuilds
   `continue_watching` into the composite key: SQLite needs a copy into a new table, which drizzle-kit
   emits.
2. `drizzle-kit generate --custom --name=enroll-existing-learners` produces an empty file, filled with:

   ```sql
   INSERT OR IGNORE INTO course_enrollment (user_id, course_slug)
     SELECT id, 'basic-course' FROM user;
   INSERT OR IGNORE INTO course_enrollment (user_id, course_slug)
     SELECT user_id, course_slug FROM continue_watching;
   ```

- Every `user` row counts, not only those with a `learner_profile`: the user asked that "all existing
  users" be enrolled in Basic. The second statement covers testers who opened the Advanced draft on
  develop.
- Hard-coding `'basic-course'` is acceptable in a one-shot migration. It records history ("Basic was the
  only course before enrollment existed"), not a rule that runs again.
- `INSERT OR IGNORE` keeps the migration safe to apply to a database that already has some enrollments.

## Risks / Trade-offs

- **[Rebuilding `continue_watching` drops the table]** → drizzle-kit's generated SQL copies rows into
  `__new_continue_watching` before dropping the old table. The libSQL container test applies every
  migration to a fresh database, and a dedicated test applies the rebuild to a table that already holds
  rows and checks they survive.
- **[A forged enroll for a draft course]** → `enrollInCourse` resolves the course through the same
  catalog that hides drafts, and answers `course-not-found`.
- **[Optimistic `watchedAt` from the client clock disagrees with SQLite's]** → Only the order matters
  until the next snapshot, and the snapshot replaces client values with stored ones on the next request.
- **[Snapshot size grows]** → One row per course the learner has opened. Negligible.
- **[Old clients mid-deploy send the same `ContinueWatchingLocation`]** → The action input is unchanged,
  so an old tab keeps working.

## Migration Plan

1. Merge to `develop`. `vercel-build` runs `drizzle-kit migrate`, which applies the schema migration and
   then the backfill against the develop Turso database.
2. Verify on develop: accounts created before the deploy list `basic-course` in their enrollments, and a
   new account lists none until it opens a lesson.
3. Production receives both migrations with the release that promotes this work. The backfill runs
   against production's users at that moment, which is the intended "existing users" cut-off for
   production.
4. **Rollback:** the migrations are forward-only (drizzle has no down migrations). Reverting the code
   leaves an unused `course_enrollment` table, and old code reading `continue_watching` by `user_id`
   would see several rows. For that case, a manual SQL script keeps the latest row per user; it is kept
   in the change folder next to this design, to use only if a rollback is ever needed.

## Testing strategy

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| `enrollInCourse`, `recordContinueWatching` use cases (ok, course-not-found, repository failure) | Vitest unit with in-memory adapters | `record-playback-position.test.ts`, `mark-lesson-complete.test.ts` |
| `InMemoryCourseEnrollmentRepository` | Vitest unit | `in-memory-prize-claim-repository.test.ts` |
| `TursoCourseEnrollmentRepository` (idempotent, isolated, cascade) | Vitest integration against libSQL testcontainer | `turso-prize-claim-repository.test.ts` |
| `TursoContinueWatchingRepository` per course: `get()` latest, `list()` order, per-course replace, corrupt rows skipped | Vitest integration | `turso-continue-watching-repository.test.ts` (rewritten) |
| Backfill SQL enrolls every user in Basic plus their resume courses, and is idempotent | Vitest integration: run the migration file's statements against a migrated container holding users | `libsql-container.test.ts` |
| `continue_watching` rows survive the rebuild | Vitest integration | new, next to `schema.test.ts` |
| Snapshot carries enrollments and per-course records | Vitest integration | `learner-snapshot.test.ts` |
| Learner-store continue-watching adapter: combined optimistic enroll and rollback, `get()` from the head | Vitest unit | `learner-store-continue-watching-repository.test.ts` and the store helpers in `src/test-setup/learner-store/` |
| `enrollInCourseAction` / `recordContinueWatchingAction` refuse without a session and never take a learner id | Vitest unit | `learner-actions.test.ts` |
| `useEnrolledCourses` empty before hydration, set after | Vitest + RTL `renderHook` | `use-claimed-prizes` tests |
| Opening a lesson as a new account enrolls in its course (survives reload) | Playwright e2e | `learner-progress-sync.spec.ts` with `learner-state-fixture.ts` |

The existing My learning, achievements and module-route tests stay green unchanged. That is the check
that `get()` kept its meaning.
