## ADDED Requirements

### Requirement: The Atlas of American Sounds is a declared reference course

The catalog SHALL declare a course titled `Atlas of American Sounds`, with slug
`atlas-of-american-sounds`, language `en` and `"track": "reference"`, in its own manifest at
`src/content/atlas-of-american-sounds.json`, enumerated by `src/content/courses.ts` after the two
level courses. Its `sequence` SHALL be unique across the catalog and greater than both level
courses' sequences.

Its description SHALL say what the course teaches — every sound of American English, one lesson
each — and SHALL credit the Sounds American channel as the author of its videos.

#### Scenario: The course is in the catalog as a reference
- **WHEN** the catalog is built from `src/content/`
- **THEN** it holds a course with slug `atlas-of-american-sounds`, titled `Atlas of American Sounds`,
  whose track is `reference`

#### Scenario: The videos are credited
- **WHEN** the course's description is read
- **THEN** it names Sounds American as the source of the videos

### Requirement: The Atlas is organised in twelve modules by sound family

The course SHALL hold exactly these twelve modules, in this order, with these lesson counts:

| # | Module slug | Title | Lessons |
| --- | --- | --- | --- |
| 1 | `1-the-vowel-map` | The Vowel Map | 2 |
| 2 | `2-front-vowels` | Front Vowels | 10 |
| 3 | `3-central-vowels` | Central Vowels | 4 |
| 4 | `4-back-vowels` | Back Vowels | 5 |
| 5 | `5-diphthongs` | Diphthongs | 3 |
| 6 | `6-r-colored-vowels` | R-Colored Vowels | 9 |
| 7 | `7-stop-consonants` | Stop Consonants | 9 |
| 8 | `8-fricatives` | Fricatives | 9 |
| 9 | `9-affricates` | Affricates | 2 |
| 10 | `10-nasals` | Nasals | 4 |
| 11 | `11-liquids` | Liquids | 4 |
| 12 | `12-glides` | Glides | 2 |

Within a module:

- the channel's overview for that sound family SHALL come first when it exists;
- the single-sound lessons SHALL follow, in the order of the channel's "Each and Every Sound of
  American English" playlist;
- the minimal-pair contrasts SHALL come after both of their sounds have been taught, at the end of
  the module.

No module slug of this course SHALL equal a module slug of another course, because prize claims are
keyed by module slug.

#### Scenario: Sixty-three lessons in twelve modules
- **WHEN** the course's modules and lessons are counted
- **THEN** there are 12 modules and 63 lessons, with the per-module counts in the table

#### Scenario: A contrast follows both of its sounds
- **WHEN** the Front Vowels module is listed
- **THEN** its lessons `/i/` and `/ɪ/` precede the contrast `Sheep or Ship?`

#### Scenario: An overview opens its module
- **WHEN** the Stop Consonants module is listed
- **THEN** its first lesson is the stop consonants overview and its second is `/p/`

#### Scenario: Module slugs are the course's own
- **WHEN** the Atlas's module slugs are compared with every other declared course's
- **THEN** no slug appears in both

### Requirement: Every Atlas lesson streams its video from YouTube with a declared duration

Every Atlas lesson SHALL be a video lesson whose `source` is
`https://www.youtube.com/embed/<videoId>` for a video of the Sounds American channel, and whose
`durationSeconds` is that video's runtime. No two lessons in the catalog SHALL share a video.

A single-sound lesson's title SHALL name the sound in IPA and a key word, in the form
`/æ/ as in “cat”`, using typographic quotes and apostrophes.

#### Scenario: A sound lesson plays its own video
- **WHEN** the lesson `2-front-vowels/5-ae-as-in-cat` is opened
- **THEN** it embeds `https://www.youtube.com/embed/mynucZiy-Ug` and reports 324 seconds

#### Scenario: A sound lesson names its sound
- **WHEN** the Front Vowels module's fifth lesson is listed
- **THEN** its title reads `/æ/ as in “cat”`

### Requirement: Every Atlas lesson has a locally stored poster from its video

Every Atlas lesson SHALL declare a `poster` content key,
`atlas-of-american-sounds/<module>/<lesson>/thumbnail.jpeg`. The file SHALL be that lesson's YouTube
thumbnail at 1280×720, stored in the tracked content tree and served through `BlobStore` like every
other poster. No Atlas poster SHALL be an absolute URL.

#### Scenario: A poster resolves locally
- **WHEN** an Atlas lesson's poster is resolved with the default location manifest
- **THEN** its URL begins with `/local-filesystem-lesson/atlas-of-american-sounds/`, and the file
  exists and is a 1280×720 JPEG

### Requirement: Every Atlas lesson carries trilingual notes

Every Atlas lesson SHALL declare a `notesKey` and a notes resource pointing at its `readme.md`, as
the other courses' lessons do. The file SHALL open with a `#` heading equal to the lesson's title.
It SHALL then carry a `## 🇪🇸 Español`, a `## 🇺🇸 English` and a `## 🇧🇷 Português` section that
mirror one another, as `course-content-storage` requires of every declared course.

A single-sound lesson's notes SHALL cover:

- how the sound is made;
- concrete English words that contain it;
- the mistake its readers typically make, stated in each section for that section's own speakers.

An overview's or contrast's notes SHALL describe what it covers without introducing sounds the video
does not teach.

The notes SHALL credit Sounds American for the video. The Vowel Map overview's notes SHALL also
warn that the chart in the video is no longer interactive.

The lesson's `description` SHALL be one sentence about that lesson, never the generic "Video lesson.
The full description lives in the linked notes" placeholder.

#### Scenario: Notes pass the shape check
- **WHEN** the notes shape check runs over the Atlas's lessons
- **THEN** every `readme.md` has the three language sections, each opening with a `###` sub-heading,
  and no mirroring violation is reported

#### Scenario: A sound lesson's notes give words to repeat
- **WHEN** the notes of `/θ/ as in “think”` are read in any locale
- **THEN** they list English words containing /θ/

#### Scenario: The chart caveat is stated
- **WHEN** the notes of the vowel chart lesson are read
- **THEN** they say the chart shown in the video can no longer be clicked

#### Scenario: A description is the lesson's own
- **WHEN** any Atlas lesson's `description` is read
- **THEN** it does not contain `Resource below`
