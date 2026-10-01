## Why

The catalog teaches American pronunciation as a ladder: the Basic Course walks a Spanish speaker
through the sounds, and the Advanced Intermediate Course builds on them. Nothing lets a learner go back
to **one** sound and study it on its own, whatever level they are at. The Sounds American YouTube
channel publishes exactly that material — one lesson per sound of American English, with overviews and
minimal-pair drills — and every video can be embedded the way our two courses already are.

That course is a reference, not a rung. The app today cannot say so: `Course.sequence` is both the
catalog order and the printed "Level N", so a third course would read "Level 3", count toward gold, and
move "Keep going after Level N". Adding the course therefore also means teaching the catalog that a
course can sit **outside the levels**.

## What Changes

- **New course — "Atlas of American Sounds"** (`src/content/atlas-of-american-sounds.json`), with 12
  modules and 63 video lessons, all embedded from YouTube:
  - 49 lessons with one sound each: 12 vowels, 3 diphthongs, 7 r-colored vowels and 27 consonants,
    counting the flap T, glottal T and dark L;
  - 4 overviews: the vowel chart, long and short vowels, r-colored vowels and stop consonants;
  - 9 minimal-pair contrasts, each closing the module where both of its sounds are taught;
  - 1 advanced r-colored exercise.

  Modules follow the channel's own grouping: vowel map, front, central and back vowels, diphthongs,
  r-colored vowels, stops, fricatives, affricates, nasals, liquids and glides. The course credits
  Sounds American in its description and in every lesson's notes.
- **Posters are downloaded, not hotlinked.** Each lesson's YouTube thumbnail (`maxresdefault`,
  1280×720, the same format as today's posters) is stored as the lesson's `thumbnail.jpeg` and served
  like every other poster. The whole set is about 3 MB.
- **Trilingual notes for every lesson.** Each lesson has a `readme.md` in the existing
  🇪🇸 / 🇺🇸 / 🇧🇷 shape. Each language section describes how the sound is made, gives example
  words, and names the typical mistake for **its own** readers.
- **Courses gain a track: `level` or `reference`.** A manifest may declare `"track": "reference"`; when
  it declares nothing, the course is a level, so the existing manifests keep their meaning. `sequence`
  keeps ordering the whole catalog. The printed level number is now **derived**: it is the course's
  position among the level courses, not its `sequence`.
- **A reference course is presented as one wherever the app says "Level N".** That covers the course
  hero, the enrolled and shelf cards, the first-course facts and the course's sharing image, all of
  which read **Reference** instead. A reference course is never:
  - a row of the home levels table, nor counted in "N levels, in order";
  - the recommended first course;
  - the "N" of "Keep going after Level N";
  - required for gold.

  The home lists reference courses in their own section after the levels.
- **Distinction:** bronze still comes from completing any course. Gold comes from completing every
  **level** course, so learners who already hold gold keep it when the Atlas ships.
- **Twelve new prizes, one per Atlas module.** Each is a toy drawn in the existing prize style (a 64-unit
  SVG, three gold paints, and a silhouette state), named in `en`, `es` and `pt`, and hinting at its
  module's sounds:

  | Module | Prize | Why |
  | --- | --- | --- |
  | The Vowel Map | compass | a map needs a compass |
  | Front Vowels | xylophone | bright, high notes |
  | Central Vowels | maracas | loose, relaxed shake |
  | Back Vowels | trumpet | round, open mouth |
  | Diphthongs | boomerang | glides away and back |
  | R-Colored Vowels | roller skate | rolling r |
  | Stop Consonants | party popper | a sudden burst |
  | Fricatives | pinwheel | turns on a stream of air |
  | Affricates | jack-in-the-box | a stop that bursts into a hiss |
  | Nasals | bell | a hum that rings on |
  | Liquids | rubber duck | liquid sounds |
  | Glides | kite | glides |

  Without them, the Atlas's modules would fall back to the gift box, which the catalog test already
  forbids for shipped modules.
- The course ships published, with no `draft` flag. `draft-course-visibility` requires that no
  tracked manifest be a draft, and nothing of this change is committed until its notes are written
  and reviewed.

## Capabilities

### New Capabilities

- `atlas-of-american-sounds`: the course's content contract. It covers:
  - its modules and lessons, in order;
  - their YouTube sources and declared durations;
  - locally stored posters and trilingual notes;
  - the attribution to Sounds American;
  - module slugs that do not collide with another course's.

### Modified Capabilities

- `course-platform-domain`: `Course` carries a `track`. The level number is derived from the level
  courses' order, and `sequence` still orders the whole catalog.
- `course-content-storage`: a manifest may declare `track`, defaulting to `level`. The ladder has as
  many rungs as there are **level** manifests. The Atlas's text assets are tracked like the other two
  courses'.
- `cinema-home`: the levels table lists level courses only, and reference courses get their own
  section.
- `first-course-recommendation`: the recommended course is the first **level** course.
- `available-courses`: cards read **Reference** for a reference course. "Keep going after Level N"
  and the no-enrollment recommendation consider level courses only.
- `learner-achievements`: gold means every level course is complete, and the rewards guide's copy
  says so. The prize catalog gains the Atlas's twelve module prizes, and the counter's totals include
  the Atlas.
- `site-metadata`: a reference course's sharing image reads **Reference** where a level course reads
  "Level N".

## Non-goals

- Removing or reworking the Basic Course's Vowels and Consonants modules, which cover some of the same
  sounds from a Spanish speaker's angle.
- Letting a learner search or filter by sound. The Atlas is navigated like any other course.
- More than one reference course, or reference courses with their own ordering scheme. Reference
  courses order among themselves by `sequence`, like every course.
- Hotlinking posters from `i.ytimg.com`, and any change to `next.config.ts` image hosts.
- PDF worksheets or other resources beyond each lesson's notes.

## Impact

- **Content:**
  - new manifest `src/content/atlas-of-american-sounds.json`, plus one line in `src/content/courses.ts`;
  - new content tree `public/local-filesystem-lesson/atlas-of-american-sounds/`, with 63 lesson folders,
    each holding `thumbnail.jpeg` and `readme.md`;
  - a `.gitignore` un-ignore line for that folder, mirroring the two existing ones.
- **Domain:**
  - `Course` gains `track`;
  - the catalog use case derives each entry's standing: a level with its number, or a reference;
  - no new port, and domain imports stay as they are.
- **Adapters:** the manifest schema accepts `track` (default `level`), and the flattening copies it
  into `Course`.
- **Delivery code that reads `course.sequence` as a level number:**
  - home view, levels table and the loading shell;
  - `catalog-levels.ts` and `home-first-lesson.ts`;
  - course shelf, `use-course-shelf` (highest enrolled level) and first-course step;
  - course cinema hero, enrolled course card and course shelf card;
  - the course sharing image;
  - learner achievements (distinction).
- **Prizes:** `src/lib/module-prizes/module-prizes.ts` gains 12 prize IDs and the 12 slug mappings.
  `src/components/prize-icon/prize-icon.tsx` gains 12 illustrations, and `PrizeIcon.names` gains 12
  names in each locale.
- **Messages:** new `Reference` label and reference-section copy, and the reworded gold line, in
  `en`, `es` and `pt`.
- **Tests:**
  - unit and component tests for everything above;
  - e2e specs that count courses as levels (`home`, `available-courses`, `one-click-navigation`);
  - a catalog test for the new course's shape.
