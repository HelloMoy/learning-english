## 1. Domain: track and standing

- [x] 1.1 `Course` gains a required `track: "level" | "reference"`; the tests accept both values and reject an unknown or missing track (TDD: `course.test.ts` → `course.ts`). Update the domain fixtures and stubs that build a `Course`.
- [x] 1.2 Add a pure `courseStandings(courses)` that numbers level courses 1..n in `sequence` order and marks reference courses. It needs its own folder, per folder-per-entity (TDD: consecutive levels around a reference; today's catalog gives 1, 2, reference → impl).
- [x] 1.3 `findCourseCatalog` attaches each entry's standing without an extra repository call (TDD: `find-course-catalog.test.ts` → impl).
- [x] 1.4 Add one helper that picks the first course as the level-1 entry, never `entries[0]` (TDD: a reference course sorted first is skipped → impl).

## 2. Adapters: manifest track

- [x] 2.1 The manifest schema declares `track` with a default of `level`: a missing track parses as a level, an unknown one throws `InvalidCourseManifestError` naming the course, and `sequence` stays unique across tracks (TDD: `course-manifest-schema.test.ts` → schema).
- [x] 2.2 `flattenCourseManifests` copies `track` into `Course` (TDD: `flatten-course-manifests.test.ts` → impl).

## 3. Atlas content: manifest, posters, tracking

- [x] 3.1 Add catalog tests for the Atlas in `content-manifest.test.ts`, and see them fail. They check:
  - the course is present with reference track, 12 modules and 63 lessons with the per-module counts;
  - every source is a unique YouTube embed;
  - module slugs are disjoint from other courses';
  - every poster is a local `atlas-of-american-sounds/…/thumbnail.jpeg` key;
  - no description contains "Resource below";
  - the description credits Sounds American.
- [x] 3.2 A throwaway scratchpad generator writes `src/content/atlas-of-american-sounds.json` from the design's lesson plan, with UUIDv5 IDs from `scripts/uuid.ts`, `sequence: 3`, `"track": "reference"`, and no `draft` flag. It also writes a one-sentence description per lesson and the notes resources.
- [x] 3.3 The same generator downloads the 63 `maxresdefault.jpg` thumbnails to `public/local-filesystem-lesson/atlas-of-american-sounds/<module>/<lesson>/thumbnail.jpeg`, and checks each one is a 1280×720 JPEG.
- [x] 3.4 Add `!public/local-filesystem-lesson/atlas-of-american-sounds/` to `.gitignore` beside the other two courses, and confirm `.mp4` files stay ignored.
- [x] 3.5 Register the manifest in `src/content/courses.ts` after the two level courses; the tests from 3.1 turn green (TDD: 3.1 → 3.2–3.5). The existing "every shipped module has its own catalogued prize" test turns red here, and 6.1 closes it. Commit the two together, never 3.5 alone.

## 4. "First course" and levels on the server side

- [x] 4.1 `catalog-levels.ts` carries each entry's standing, and `firstLearnerLevel` uses the level-1 helper (TDD: `catalog-levels.test.ts` → impl).
- [x] 4.2 `home-first-lesson.ts` uses the level-1 course (TDD: `home-first-lesson.test.ts` → impl).
- [x] 4.3 `course-views.ts` exposes the standing on each course view, and the first-course page picks the level-1 view (TDD: covered by the 4.x unit tests and 5.6 → impl).

## 5. Components: Level N vs Reference

- [x] 5.1 Add the messages in `en`, `es` and `pt`:
  - the `Reference` label;
  - the reference section heading on the home;
  - `Reference · {modules} · {videos}` facts where "Level {level} · …" exists;
  - the gold line "every level".
- [x] 5.2 The `LevelsTable` row renders `Level {n}` or `Reference` from its standing; add a Reference-row story (TDD: `levels-table.test.tsx` → impl).
- [x] 5.3 `HomeView`: the levels heading counts level courses, the levels table holds level courses, and a reference section follows only when reference courses exist. The hero note names the level-1 course (TDD: `home-view.test.tsx` → impl).
- [x] 5.4 The loading shell adds one reference-row shape and its comment is updated (TDD: `loading.test.tsx` → impl).
- [x] 5.5 `CourseCinemaHero`, `EnrolledCourseCard` and `CourseShelfCard` read the standing; add stories for the reference variant (TDD: each component test → impl).
- [x] 5.6 `FirstCourseStep` prints the level-1 course's derived level (TDD: `first-course-step.test.tsx` → impl).
- [x] 5.7 `course-shelf.ts` recommends the level-1 course when nothing is enrolled. `use-course-shelf` computes `highestEnrolledLevel` from level standings only, and it is `null` when only a reference course is enrolled (TDD: `course-shelf.test.ts`, `use-course-shelf.test.ts` → impl).
- [x] 5.8 `AvailableCoursesView` "Keep going after Level N" follows 5.7 (TDD: `available-courses-view.test.tsx` → impl).
- [x] 5.9 The course sharing image's kicker reads `Reference` for a reference course (TDD: the opengraph-image test, or a unit test on the kicker helper → impl).
- [x] 5.10 `distinctionFor` weighs level courses for gold and any course for bronze; `AchievementsGuideModal` shows the new gold line (TDD: `learner-achievements.test.ts`, `achievements-guide-modal.test.tsx` → impl).
- [x] 5.11 Search for leftover level reads: `rg "\.sequence"` over `src/components`, `src/app`, `src/lib` and `src/hooks` finds only sorting. Update any stories still showing "Level N" from `sequence`.

## 6. Prizes for the Atlas modules

- [x] 6.1 `module-prizes.test.ts` maps each of the 12 Atlas slugs to its prize, and the "every shipped module has its own catalogued prize" test fails for the Atlas. Add the 12 IDs to `PRIZE_IDS` and the slug mappings to `PRIZE_BY_MODULE_SLUG` (TDD: test → impl).
- [x] 6.2 Add the 12 names to `PrizeIcon.names` in `en`, `es` and `pt`, using the design's table.
- [x] 6.3 Draw `compass`, `xylophone`, `maracas` and `trumpet` in `PRIZE_SHAPES`; `prize-icon.test.tsx` `test.each(PRIZE_IDS)` fails first for the missing shapes (TDD: test → impl).
- [x] 6.4 Draw `boomerang`, `skate`, `popper` and `pinwheel`.
- [x] 6.5 Draw `jackbox`, `bell`, `duck` and `kite`.
- [x] 6.6 Review all 12 in Storybook with Playwright MCP, in colour and silhouette, beside the existing 16 and at the counter's size, and redraw any that fail the D10 checks. Then check the Achievements page with an Atlas prize claimed.

## 7. Notes for the 63 lessons

- [x] 7.1 `verify-notes-shape.test.ts` reads every course from `courseManifests` instead of importing two JSONs; it fails on the Atlas's missing notes (TDD: test first).
- [x] 7.2 For each video, fetch its YouTube description and captions where available into the scratchpad, as grounding for the notes.
- [x] 7.3 Write the notes for modules 1–4 (vowel map, front, central, back): 21 `readme.md` files, trilingual and mirrored. They credit Sounds American, and the Vowel Chart notes carry the "no longer interactive" warning.
- [x] 7.4 Write the notes for modules 5–6 (diphthongs, r-colored vowels): 12 files.
- [x] 7.5 Write the notes for modules 7–9 (stops, fricatives, affricates): 20 files.
- [x] 7.6 Write the notes for modules 10–12 (nasals, liquids, glides): 10 files. The shape and mirroring test from 7.1 passes for the whole catalog.

## 8. End-to-end

- [x] 8.1 `home.spec.ts` counts levels from the level courses. The Atlas row sits in the reference section and opens the Atlas overview (TDD: update the spec to fail → green).
- [x] 8.2 `available-courses.spec.ts` reads the course list from the catalog instead of assuming two, and asserts the Atlas shelf card reads Reference; update `one-click-navigation.spec.ts` for level rows only.
- [x] 8.3 Add a smoke path that opens the first Atlas sound lesson and asserts its YouTube embed, its poster and its notes tab in `es`.

## 9. Publish and verify

- [x] 9.1 Check the home, Available courses, the Atlas overview and one Atlas lesson with Playwright MCP, at desktop and 390 px, in `en` and `es`.
- [x] 9.2 The user reviews the notes and the prizes before anything is committed.
- [x] 9.3 Run `pnpm verify` and `pnpm test:e2e` (per the local e2e notes: `PLAYWRIGHT_BASE_URL`, `--workers=1` for flakes), and fix any failure at its root.
