## 1. Content and assets

- [x] 1.1 Replace the Advanced Intermediate Course's default description in `src/content/advanced-intermediate-course.json` with a real catalog description, and assert it in the content catalog test (TDD: test → impl)
- [x] 1.2 Add `public/audio/minimal-pairs/ship.mp3` and `sheep.mp3` (mono MP3, US English) and a Vitest check that both files exist (TDD: test → impl)

## 2. Domain and delivery data

- [x] 2.1 `findContinueWatchingAction` returns `courseSlug`, `moduleId`, `moduleSequence` and `lessonSequence` in `ContinueWatchingPanel`; `findContinueWatching` stays unchanged and still never lists the course (TDD: test in `actions.test.ts` → impl)
- [x] 2.2 `findCourseCatalog` projects `modules` (all, sequence order) and `lessonRuntimes` (`{ id, moduleId, durationSeconds }`, `0` for reading lessons) and drops `leadingModules` (TDD: test → impl)
- [x] 2.3 Widen `useCourseWatchProgress` to `ReadonlyArray<LessonProgressSlice>`, add `toLessonProgressSlice`, and map `OutlineDrawer`'s lessons through it (TDD: hook test → impl; existing drawer tests stay green)
- [x] 2.4 Pure helper that counts a module's lessons from `lessonRuntimes` (TDD: unit test → impl)

## 3. Client state and playback logic

- [x] 3.1 `useHomeLearnerState` — `new-visitor` on server/hydration, `resolving` once a record exists, `returning` with the panel, back to `new-visitor` when unresolvable; injectable repository and resolver (TDD: hook test → impl)
- [x] 3.2 `useClipSequence` — plays clip ids in order with a pause, exposes the playing id, interrupts the current sequence, returns to idle on end and on a rejected `play()`; injectable audio factory (TDD: hook test → impl)

## 4. Vowel-length card

- [x] 4.1 Add `Components.VowelLengthCard` messages to `en`, `es`, `pt` (anchor note in each locale's terms) (TDD: parity test in `messages.test.ts` stays green after keys are added)
- [x] 4.2 `VowelLengthCard` — rows with emphasized vowels, IPA, tracks, labels, anchor note, `Play {word}` buttons with `aria-pressed`, playing glyph and fill, `Play both`, `variant` eyebrow, reduced-motion fill (TDD: RTL test with fake audio factory → impl)
- [x] 4.3 `VowelLengthCard` stories (both variants, playing state, `es`/`pt`) and JSDoc

## 5. Home sections

- [x] 5.1 Add `HomePage.newVisitor`, `HomePage.questions`, `HomePage.levels`, `HomePage.returning`, `Components.LevelsTable`, `Components.CourseProgressList` messages to all three locales (TDD: parity test stays green)
- [x] 5.2 `NewVisitorHero` — new-visitor copy with one primary link to the first lesson and the card slot; `ReturningHero` — returning copy with its resume panel (position line, title, optional bar, `Resume`, quiet course link) (TDD: RTL → impl)
- [x] 5.3 `HeroSkeleton` — placeholder of the returning hero's shape, naming no lesson (TDD: RTL → impl)
- [x] 5.4 `LearnerQuestions` — three numbered, localized questions and answers (TDD: RTL → impl)
- [x] 5.5 `CourseProgressList` — course totals and one row per module in sequence with ordinal, title, bar and counts; completed and current markers; tracks without fills before hydration (TDD: RTL with fake progress inputs → impl)
- [x] 5.6 `LevelsTable` — rows in sequence with ordinal, title, description, counts and one link; in-progress badge, counts and `Continue course` for the continued course; empty state (TDD: RTL → impl)
- [x] 5.7 `StartHereBand` — new-visitor band repeating the first-lesson link; `KeepGoingBand` — returning band with remaining videos (ICU plural), lesson position and `Resume`, or module complete with course link (TDD: RTL → impl)
- [x] 5.8 Stories and JSDoc for every section in 5.2–5.7, light and dark, `en`/`es`/`pt`

## 6. Composition

- [x] 6.1 `HomeView` switches on `useHomeLearnerState` and composes the new-visitor, resolving and returning layouts responsively (TDD: RTL with injected hook inputs → impl)
- [x] 6.2 `src/app/[locale]/page.tsx` passes catalog levels (with modules and lesson runtimes) and the first lesson's href to `HomeView`, through the page-level `homeFirstLesson` helper (TDD: helper unit test → impl)
- [x] 6.3 Redraw `src/app/[locale]/loading.tsx` to trace the editorial hero and levels table (TDD: update `loading.test.tsx` → impl)

## 7. Removal

- [x] 7.1 Delete `CinemaHero`, `ContinueWatching`, `CourseLadder`, `CourseLevelCard` (component, stories, tests) once `grep` shows no caller, and remove their now-unused message keys from all locales (TDD: parity and type checks stay green)

## 8. End-to-end

- [x] 8.1 Replace `e2e/home-course-ladder.spec.ts` with `e2e/home.spec.ts`: new visitor sees the hero action to the first lesson and every level row in order; `/es` copy; opening a lesson then visiting home shows `Welcome back`, the lesson position and a working `Resume`; the continued course's row is marked; pressing `Play ship` reaches the pressed state. Rework the home assertions in `e2e/one-click-navigation.spec.ts` (card-body click) and `e2e/course-catalog.spec.ts` (`course-ladder` test id), which target the removed ladder (TDD: write spec first, confirm red against old home → green after 6.x)
- [x] 8.2 Update `e2e/loading-skeletons.spec.ts` if the home shell selectors changed — none did; the spec passes unchanged (TDD: test → impl)

## 9. Verification

- [x] 9.1 Visual check with Playwright MCP: new visitor and returning states, light and dark, 1440px and 390px; no horizontal scroll at 320px
- [x] 9.2 Run `pnpm verify` and `pnpm test:e2e` for `e2e/home.spec.ts` and `e2e/loading-skeletons.spec.ts` (with `PLAYWRIGHT_BASE_URL` per this machine's setup) and fix every failure
