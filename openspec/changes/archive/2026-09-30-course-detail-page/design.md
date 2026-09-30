## Context

`/[locale]/courses/[courseSlug]` is a Server Component that loads `findCourseForView` and renders
`CourseOverview`, whose one client island (`CourseProgressBoard`) reads this device's progress after
hydration. Everything learner-specific in this app is decided on the client from the learner store,
which `LearnerStateSeed` seeds from the server snapshot in a layout effect; the server render knows no
enrollments by design (`course-enrollment`). Available courses already sorts courses by enrollment this
way through `useCourseShelf`.

Two facts from the existing specs constrain the page:

- Opening any lesson enrolls the learner (`course-enrollment`). A "watch the first video" button on a
  page for learners who have not joined would enroll them silently.
- User-facing vocabulary is Course → Lesson (domain `Module`) → Video (domain `Lesson`)
  (`course-vocabulary`), with ordinals as text outside titles.

The approved visual direction is the "Recommended" option of the design review artifact: cinema hero,
outcomes, sound strip, syllabus accordion, sticky enroll card with a pace picker, phone bottom bar.

## Goals / Non-Goals

**Goals:**

- A learner who has not joined a course can see what it teaches, what is in it and how long it takes,
  and enroll from the same page.
- Enrolled learners see exactly today's progress board, untouched.
- Outcomes and sounds are catalog data, declared per course, not copy in components.

**Non-Goals:** everything listed under Non-goals in the proposal — public course routes, outcomes on
the board, translated course content, preview-without-enrolling, un-enrolling.

## Decisions

### D1. A client switch picks the page; the server renders both candidates

The page stays a Server Component. It renders `<CoursePageSwitch courseSlug title detail={…}
board={…} />`, passing the course page and today's `CourseOverview` as React nodes. The switch reads
`isSeeded` and `useEnrolledCourses()`:

- not seeded → a pending shape (the title as `<h1>` and skeletons);
- seeded → it remembers whether the course was enrolled **on arrival** (the first seeded render) and
  renders `board` if so, `detail` otherwise.

Remembering arrival is what keeps the learner on the page after enrolling from it: the optimistic
enrollment flips `useEnrolledCourses()` at once, and a switch that followed it live would swap the page
for the board under the learner's cursor. The arrival value is stored with the "adjust state during
render" pattern (a `useState` set once when seeding is first observed), so no effect and no extra
paint.

*Alternative — branch on the server with `currentLearnerSnapshot()`.* It would remove the pending
shape, but it reads the session and database a second time per request, breaks the project rule that
the server renders no learner state, and a client-side enroll would still need client state to update
the page. Rejected.

*Alternative — a separate route (`/courses/[slug]/about`).* Two URLs for one course, and Preview
course, structured data and share metadata would all have to pick one. Rejected; the route already
means "this course".

### D2. The course page is one client component fed a `CourseForView`

`CourseDetailView` takes the same serializable `CourseForView` Available courses already passes to the
client, so no new use case is needed. Its sections are separate components, each owning one job:

| Component | Job | Client? |
| --- | --- | --- |
| `CourseDetailView` | Composes the sections and the two-column layout | yes (reads enrollment) |
| `CourseDetailHero` | Cinema frame, marks, facts, prizes, action | yes |
| `CourseEnrollAction` | **Enroll** button / **Start course** link | yes |
| `CourseOutcomes` | What you'll learn checklist | no |
| `CourseSoundStrip` | Counted IPA vowels then consonants | no |
| `CourseSyllabus` | Lessons as `<details>` rows, videos inside | no |
| `CourseEnrollCard` | Action, size stats, pace picker | yes (pace state) |
| `CourseEnrollBar` | Phone bottom bar | yes |
| `CoursePageSwitch` | D1 | yes |

`CourseEnrollAction` reads `useEnrolledCourses()` itself, so the hero, card and bar cannot disagree
(spec: all three agree). Enrolling calls the existing `enrollInCourse(slug)`; nothing new on the server.

### D3. The syllabus uses native `<details>`/`<summary>`

Native disclosure gives keyboard operation, the open state to assistive technology and zero client
JavaScript. The `<summary>` holds the ordinal, artwork, title, counts and prize; the ordinal sits in
its own element before the title (`course-vocabulary`). The project has no accordion primitive, and
adding Radix Accordion would be a dependency for what the platform already does.

### D4. Outcomes and sounds live on `Course`, optional

`CourseManifest` gains `outcomes?: string[]` and `sounds?: { vowels: string[]; consonants: string[] }`
(non-empty strings, validated by Zod), `flattenCourseManifests` copies them, and the domain `Course`
schema declares them optional. Optional rather than defaulted, because a default makes the field
required on the inferred type and would force the 65 test files that build a `Course` literal to add
it for no behavior. Consumers read `course.outcomes ?? []`, in one place each.

*Alternative — a new port for course marketing copy.* A second repository for two fields that are
declared in the same manifest as the course. Rejected.

### D4b. Translations sit beside the manifest's own copy

A manifest keeps `description` and `outcomes` in its own `language` and adds
`translations: { es: { description, outcomes }, pt: { … } }`. `Course` carries `translations`
(optional, same reason as D4), and a pure `courseCopy(course, locale)` in `src/lib/course-copy/` picks
each field from the locale's entry or falls back to the manifest's own. Client components pass
`useLocale()`; server surfaces (metadata, share image, `courseSchema`) pass the route's `locale`.

*Alternative — make `description` a `{ en, es, pt }` object.* Every existing reader of
`course.description` (and every test fixture that builds a `Course`) would change type at once, and
the domain would have to know the app's locale list. Keeping the manifest's own copy as the default
changes nothing for code that does not ask for a locale.

*Alternative — pass the locale into `CourseRepository`.* Would push a presentation concern through a
domain port. Rejected.

Only the prose is translated. Titles stay as declared because they are shared with YouTube and the
lesson notes, and the lessons themselves are recorded in one language.

### D5. Pace is a pure function

`studyPace(runtimeSeconds, minutesPerDay) → { days, weeks }` in `src/lib/study-pace/`: days =
⌈runtime minutes ÷ minutes a day⌉, weeks = max(1, round(days ÷ 7)). The card keeps the selected minutes
in `useState`; it is not URL state, since nothing about it is worth sharing.

### D6. Prizes are drawn locked

The page is for learners who have not joined, so every prize renders as the silhouette through
`PrizeIcon locked`, one per lesson with videos (`prizeForModule`), matching the board's counting rule.

### D7. Layout

Single column on phones: hero, outcomes, sounds, syllabus, card, then the bottom bar (`sticky
bottom-0`, `lg:hidden`). From `lg`, a `minmax(0,1fr) 20rem` grid with the card `sticky` below the site
header. The hero reuses the Available courses frame classes (21:9 from `lg`, gradient into
`--background`), with the placeholder glow when the first video has no poster.

## Risks / Trade-offs

- [Enrolled learners see a pending shape for one frame before the board] → Seeding runs in a layout
  effect before first paint after hydration; the shape carries the title, so nothing jumps above the
  fold. Same cost the board already pays for progress.
- [Both trees are serialized into the RSC payload] → The course page is text and poster URLs; the
  board is unchanged. Acceptable for one route.
- [E2E specs that open a course the fixture learner has not joined will now see the course page] →
  Run the whole Playwright suite; re-point or enroll in fixtures where a spec means the board.
- [Outcomes are product claims written from lesson titles] → Called out for the user's review before
  archive.
- [Lesson titles in content are mixed English/Spanish] → Rendered as declared; the page does not
  translate content.

## Testing strategy

| Behavior | Layer | Where / pattern mirrored |
| --- | --- | --- |
| Manifest accepts, rejects and passes through `outcomes`/`sounds` | Vitest unit | `course-manifest-schema.test.ts`, `flatten-course-manifests` tests |
| `studyPace` arithmetic (20 min → 5 weeks, 45 → 2, floor of 1 week) | Vitest unit | new `study-pace.test.ts` |
| Switch: pending shape, board when enrolled on arrival, detail otherwise, stays on detail after enrolling | Vitest + RTL | seeds `learnerStore` like `available-courses-view.test.tsx` |
| Enroll action: button → optimistic Start course link to first video, rollback on refusal | Vitest + RTL | mocks `learner-actions` like `course-shelf-card.test.tsx` |
| Hero marks, facts line, chip not a link, prize count | Vitest + RTL | `course-cinema-hero.test.tsx` |
| Outcomes order; sound count and grouping; no section when absent | Vitest + RTL | new colocated tests |
| Syllabus order, ordinals, `<details>` opening, durations | Vitest + RTL with `user-event` | new colocated test |
| Card pace picker and enrolled state | Vitest + RTL | new colocated test |
| Not-enrolled learner sees the page, enrolls, reload shows the board; enrolled learner sees the board; phone bar | Playwright | new `e2e/course-detail-page.spec.ts`, fixtures from `learner-profile-fixture.ts` |
| No regression on the board and on specs that open courses | Playwright | full chromium suite, serial where flaky |

Stories for every new component (`Components/` prefix), rendered in en/es/pt and both themes.
