## 1. Catalog data

- [x] 1.1 `CourseManifest` accepts optional `outcomes` and `sounds` with non-empty strings and rejects an empty one naming the course (TDD: test → impl) in `course-manifest-schema`
- [x] 1.2 `Course` entity declares optional `outcomes` and `sounds`; `flattenCourseManifests` passes them through (TDD: test → impl)
- [x] 1.3 Declare `outcomes` in all three manifests and `sounds` in `basic-course.json` and `atlas-of-american-sounds.json`; a manifest test asserts Basic serves 5 outcomes, 15 vowels and 26 consonants (TDD: test → impl)

## 2. Pure logic

- [x] 2.1 `studyPace(runtimeSeconds, minutesPerDay)` in `src/lib/study-pace/` — days rounded up, weeks rounded, at least one (TDD: test → impl)

## 3. Components (each with test, stories, JSDoc, `Components.*` keys in en/es/pt)

- [x] 3.1 `CourseEnrollAction`: Enroll button → optimistic Start course link to the first video, rollback on refusal, none when the course has no videos (TDD: test → impl)
- [x] 3.2 `CourseOutcomes`: checklist in manifest order, nothing when empty (TDD: test → impl)
- [x] 3.3 `CourseSoundStrip`: counted heading, vowels then consonants, stated distinction, nothing when absent (TDD: test → impl)
- [x] 3.4 `CourseSyllabus`: `<details>` rows in order with Lesson N, counts, runtime, locked prize; videos with Video N and m:ss (TDD: test → impl)
- [x] 3.5 `CourseEnrollCard`: action, stats, pace picker (20 selected, weeks line), enrolled state (TDD: test → impl)
- [x] 3.6 `CourseDetailHero`: poster or glow, Level N / Reference / Enrolled mark, First video chip (not a link), facts line, h1, description, locked prizes with count, action (TDD: test → impl)
- [x] 3.7 `CourseEnrollBar`: phone bottom bar with title, videos · runtime, action (TDD: test → impl)
- [x] 3.8 `CourseDetailView`: composes the sections in order with the two-column layout from `lg` (TDD: test → impl)
- [x] 3.9 `CoursePageSwitch`: pending shape with title h1; board when enrolled on arrival; detail otherwise; stays on detail after enrolling from it (TDD: test → impl)

## 4. Route

- [x] 4.1 Course route renders `CoursePageSwitch` with `CourseDetailView` and `CourseOverview`; structured data and metadata unchanged
- [x] 4.2 Visual check with Playwright MCP: desktop and phone, light and dark, en/es — not enrolled, enrolled, Atlas (Reference, sounds) and Advanced (no sounds)

## 5. End to end

- [x] 5.1 `e2e/course-detail-page.spec.ts`: a learner enrolled only in Basic opens Advanced → course page with What you'll learn and Enroll; enrolls → Start course; reload → board; Basic still opens the board; phone bar is visible on a narrow viewport (TDD: test → impl)
- [x] 5.2 Run the full chromium Playwright suite; fix specs that expected the board for a course the fixture learner has not joined

## 6. Verification

- [x] 6.1 `pnpm verify` (typecheck, format, lint, Vitest) green
- [x] 6.2 `pnpm test:e2e` for the touched specs green on chromium, serial run to separate flakes

## 7. Translated description and outcomes

- [x] 7.1 `CourseManifest` accepts `translations` keyed by two-letter code, rejects a bad key or an empty string naming the course; `Course` carries it and `flattenCourseManifests` passes it through (TDD: test → impl)
- [x] 7.2 `courseCopy(course, locale)` in `src/lib/course-copy/`: per-field translation with fallback to the manifest's own (TDD: test → impl)
- [x] 7.3 Translate the three manifests' description and outcomes to es and pt; a catalog test asserts every course has both with matching outcome counts (TDD: test → impl)
- [x] 7.4 Course page (hero description, outcomes) reads through `courseCopy` for the active locale (TDD: test → impl)
- [x] 7.5 Levels table and first-course step show the localized description (TDD: test → impl)
- [x] 7.6 Course metadata description, share image headline and `courseSchema` description follow the route's locale (TDD: test → impl)
- [x] 7.7 Storybook fixture passes translations; visual check under `/es` and `/pt`
- [x] 7.8 `pnpm verify` green and the course e2e specs green on chromium
