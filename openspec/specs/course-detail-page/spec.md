# course-detail-page Specification

## Purpose
Give a learner who has not joined a course a page that says what the course teaches, what is in it
and how long it takes, and lets them enroll from it. The page lives on the course route
(`/[locale]/courses/[courseSlug]`) and gives way to the progress board (`cinema-course-overview`) once
the learner is enrolled on arrival; its own route, `/[locale]/courses/[courseSlug]/about`, shows it to
every learner, which is where the board links to it.
## Requirements
### Requirement: The course route shows the course page until the learner has joined

`/[locale]/courses/[courseSlug]` SHALL decide what to render from the learner's enrollments once the
learner store is seeded:

- a learner **not enrolled** in the course SHALL see the **course page**;
- a learner **enrolled** in the course when the store was first seeded SHALL see the progress board
  (`cinema-course-overview`);
- a learner who enrolls while on the course page SHALL keep seeing the course page, in its enrolled
  state, until they leave the route.

Before the store is seeded, including on the server, the route SHALL render a pending shape that
contains the course title as the page's level-one heading and names no enrollment state: no **Enroll**,
no **Start course** and no progress.

#### Scenario: A learner who has not joined sees the course page
- **WHEN** a learner enrolled only in `basic-course` opens `/en/courses/advanced-intermediate-course`
- **THEN** the course page renders with **Enroll**, and no progress ring or continue tile renders

#### Scenario: An enrolled learner keeps the progress board
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course`
- **THEN** the progress board renders and the course page does not

#### Scenario: Enrolling keeps the learner on the course page
- **WHEN** a learner activates **Enroll** on the course page
- **THEN** the course page stays, now marked enrolled, and its action reads **Start course**

#### Scenario: The next visit opens the board
- **WHEN** a learner who enrolled from the course page reloads the route
- **THEN** the progress board renders

#### Scenario: The server render asserts no enrollment
- **WHEN** the route renders before the learner store is seeded
- **THEN** the course title is the level-one heading and neither **Enroll**, **Start course** nor a progress figure renders

### Requirement: The course page opens with a cinema hero

The course page SHALL open with a hero in the same frame as the Available courses hero: the course's
first video's poster (or a decorative placeholder), fading into the page background. The hero SHALL show:

- a mark reading `Level N`, or **Reference** for a reference course, which reads **Enrolled** once the
  learner is enrolled;
- on wide viewports, a chip with the first video's thumbnail, its title and duration, labelled
  **First video**; the chip SHALL NOT be a link, because opening a video enrolls the learner;
- the facts line `Level N · L lessons · V videos · runtime`, or `Reference · L lessons · V videos ·
  runtime`, counting modules as lessons and lessons as videos (`course-vocabulary`);
- the course title as the page's level-one heading, and the course description;
- the course's prizes, one per lesson that holds videos, as silhouettes, with their count as text;
- the enroll action.

#### Scenario: A level course states its level
- **WHEN** the Basic Course's page renders
- **THEN** the hero reads `Level 1`, its facts line reads `Level 1 · 5 lessons · 48 videos · 10 h 29 min`, and five prize silhouettes render with the text `5 prizes`

#### Scenario: A reference course states that it is reference
- **WHEN** the Atlas of American Sounds' page renders
- **THEN** the mark reads `Reference` and the facts line begins `Reference ·` with no level number

#### Scenario: The first video is named, not linked
- **WHEN** the Basic Course's page renders on a wide viewport
- **THEN** a chip labelled First video names `Introduction` and `08:11`, and it is not a link

### Requirement: The enroll action enrolls, then starts the course

The enroll action SHALL render in the hero, in the enroll card and in the narrow-viewport bottom bar,
and all three SHALL agree. While the learner is not enrolled it SHALL be a button reading **Enroll**
that enrolls through the client enrollment (`course-enrollment`): optimistic, and withdrawn when the
server refuses. Once enrolled it SHALL be a link, through the locale-aware lesson path, to the video
the course overview's continue tile would open (`cinema-course-overview`, `continue-target`), read
from this device's progress the same way:

- **Nothing watched** — the course's first video, reading **Start course**;
- **Partly watched** — the course's continue target, reading **Continue where you left off**;
- **Everything watched** — the course's first video, reading **Watch again**.

A course with no videos SHALL offer no link once the learner is enrolled.

#### Scenario: Enrolling shows at once
- **WHEN** the learner activates **Enroll**
- **THEN** every enroll action reads **Start course** before the server answers, and the learner is enrolled after a reload

#### Scenario: A refused enrollment offers Enroll again
- **WHEN** the enroll action is refused by the server
- **THEN** every enroll action reads **Enroll** again

#### Scenario: Start course opens the first video
- **WHEN** an enrolled learner with nothing watched activates **Start course** on the Basic Course's page
- **THEN** the lesson page of the first video of lesson 1 opens

#### Scenario: A learner with progress continues where they left off
- **WHEN** an enrolled learner has completed the first video of the Basic Course and the continue-watching record names it
- **THEN** every enroll action reads **Continue where you left off** and links to the first video of lesson 2, the video the board's continue tile opens

#### Scenario: A finished course offers to watch again
- **WHEN** every video of the course counts as complete
- **THEN** every enroll action reads **Watch again** and links to the course's first video

#### Scenario: Spanish copy
- **WHEN** an enrolled learner with progress views the Basic Course's page under `/es`
- **THEN** the action reads **Continuar donde lo dejaste**

### Requirement: The course page says what the learner will learn

When the course declares outcomes, the page SHALL render a **What you'll learn** section listing them
in manifest order, each as a checklist item. When the course declares sounds, the page SHALL render a
section headed with the number of sounds, listing every vowel and then every consonant, vowels
visually distinct from consonants and the distinction stated in text. A course that declares neither
SHALL render neither section and no empty heading.

#### Scenario: Outcomes render in order
- **WHEN** the Basic Course declares five outcomes
- **THEN** What you'll learn lists those five sentences in the declared order

#### Scenario: Sounds are counted and grouped
- **WHEN** a course declares 15 vowels and 26 consonants
- **THEN** the section is headed `41 sounds you’ll master` and lists the 15 vowels before the 26 consonants

#### Scenario: A course without sounds has no sound section
- **WHEN** the Advanced Intermediate Course's page renders
- **THEN** no sound section renders

### Requirement: The syllabus lists every lesson and video in order

The page SHALL render the course's lessons (modules) in `sequence` order as disclosure rows, all
collapsed at first. A row SHALL show `Lesson N`, the lesson's first video's artwork as decoration, its
title, its video count and runtime, and its prize as a silhouette. Opening a row SHALL list its videos in
`sequence` order, each with `Video N`, its title and its duration as `mm:ss`, as the module
overview writes it. The ordinals SHALL render
outside the titles, so truncation never hides them. Rows SHALL be operable by keyboard and SHALL expose
their open state to assistive technology.

#### Scenario: Lessons are listed in order
- **WHEN** the Basic Course's page renders
- **THEN** five rows read Lesson 1 to Lesson 5 with the titles of the course's modules in `sequence` order

#### Scenario: Opening a lesson lists its videos
- **WHEN** the learner opens the row of Lesson 2 of the Basic Course
- **THEN** 17 videos are listed from `Video 1` with their titles and durations, the first reading `11:03`

### Requirement: The enroll card turns the runtime into a pace

On wide viewports an enroll card SHALL sit beside the page's sections and stay in view while they
scroll. It SHALL show the enroll action, the course's video count, runtime, lesson count and prize
count, and a pace picker offering 10, 20, 30 and 45 minutes a day with 20 selected at first. The pace
line SHALL state the number of weeks the course takes at the selected pace: the runtime in minutes
divided by the minutes a day, rounded up to whole days, then divided by seven and rounded to the
nearest whole week, never less than one. Once the learner is enrolled the card SHALL say so.

On narrow viewports the card SHALL follow the sections, and a bar holding the course title, its video
count and runtime, and the enroll action SHALL stay at the bottom of the viewport.

#### Scenario: Twenty minutes a day
- **WHEN** the Basic Course's page renders with 10 h 29 min of video
- **THEN** the pace line reads about 5 weeks at 20 minutes a day

#### Scenario: Changing the pace
- **WHEN** the learner picks 45 minutes a day on the Basic Course's page
- **THEN** the pace line reads about 2 weeks and the 45-minute option is marked selected

#### Scenario: Enrolled
- **WHEN** the learner has enrolled from the page
- **THEN** the card states that they are enrolled

### Requirement: The course page is localized

Every string the course page renders that is not course content SHALL come from the `Components.*`
namespaces in `en`, `es` and `pt`, with plural-aware counts. The description and the outcomes SHALL
render in the active locale through `courseCopy` (`course-content-storage`). Titles and sounds SHALL
render as the manifest declares them.

#### Scenario: Spanish page, titles as declared
- **WHEN** the Basic Course's page renders under `/es`
- **THEN** its headings, action, counts, description and outcomes render in Spanish, and its course, lesson and video titles render as the manifest declares them

### Requirement: The course page has its own route

`/[locale]/courses/[courseSlug]/about` SHALL render the course page to every learner, whether or not
they are enrolled in the course, in the state their enrollment calls for: **Enroll** before they join,
the enrolled state after. It SHALL never render the progress board. Before the learner store is
seeded, including on the server, it SHALL render the same pending shape as the course route: the
course title as the level-one heading and no enrollment state. A slug that names no course SHALL
render the course route's error state.

The course route (`/[locale]/courses/[courseSlug]`) SHALL keep deciding between the course page
and the progress board as before.

#### Scenario: An enrolled learner opens the course page
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course/about`
- **THEN** the course page renders in its enrolled state, and no lesson ring tile and no continue tile render

#### Scenario: A learner who has not joined opens the course page
- **WHEN** a learner not enrolled in `advanced-intermediate-course` opens `/en/courses/advanced-intermediate-course/about`
- **THEN** the course page renders with **Enroll**

#### Scenario: Reloading keeps the course page
- **WHEN** a learner enrolls from `/en/courses/advanced-intermediate-course/about` and reloads it
- **THEN** the course page renders again, in its enrolled state

#### Scenario: The server render asserts no enrollment
- **WHEN** `/en/courses/basic-course/about` renders before the learner store is seeded
- **THEN** `Basic Course` is the level-one heading and neither **Enroll**, **Start course** nor a progress figure renders

#### Scenario: An unknown course
- **WHEN** a learner opens `/en/courses/no-such-course/about`
- **THEN** the course route's error state renders

### Requirement: The enrolled enroll card leads back to the progress board

Once the learner is enrolled, the enroll card SHALL end with a **Go to my progress** link to the
course route (`/[locale]/courses/[courseSlug]`) through the locale-aware path. While the learner is
not enrolled the card SHALL offer no such link. The link text SHALL come from `en`, `es` and `pt`.

#### Scenario: Enrolled
- **WHEN** an enrolled learner views the Basic Course's page
- **THEN** the enroll card shows **Go to my progress** linking to `/en/courses/basic-course`

#### Scenario: Not enrolled
- **WHEN** a learner who has not joined views the Advanced course's page
- **THEN** the enroll card shows no **Go to my progress** link

#### Scenario: Spanish
- **WHEN** an enrolled learner views the Basic Course's page under `/es`
- **THEN** the link reads **Ir a mi progreso** and points to `/es/courses/basic-course`

