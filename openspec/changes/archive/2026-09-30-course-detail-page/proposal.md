## Why

A learner who has not joined a course has nowhere to find out what the course teaches. **Preview
course** on Available courses opens `/courses/[courseSlug]`, but that page is the progress board: a
continue tile, a 0 % ring and lesson tiles, all written for someone already taking the course. The
decision to enroll is made blind. The course enrollment views made enrolling one click; this change
gives that click something to be based on.

## What Changes

- `/[locale]/courses/[courseSlug]` shows a **course page** to a learner who is not enrolled in that
  course, and keeps showing it after they enroll from it during the same visit. A learner already
  enrolled on arrival keeps today's progress board. Until the learner state is known, the route renders
  a pending shape that asserts neither.
- The course page, taken from the recommended direction of the design review:
  - a cinema hero in the frame Available courses uses: the first video's artwork, a Level N or
    Reference mark, a chip naming the first video, the facts line, the title, the description, the
    course's prizes as silhouettes, and the enroll action;
  - **What you'll learn**: the course's outcomes as a checklist;
  - **Sounds you'll master**: the IPA symbols the course teaches, vowels set apart from consonants;
  - **Syllabus**: every lesson in order as a disclosure row (ordinal, artwork, title, video count,
    runtime, prize), opening to its videos with ordinal, title and duration;
  - an **enroll card** beside the syllabus on wide screens: the action, the course's size, and a pace
    picker that turns the runtime into weeks at 10, 20, 30 or 45 minutes a day;
  - a bottom bar with the action on narrow screens.
- The enroll action reads **Enroll** and enrolls through the existing optimistic client enrollment.
  Once enrolled it reads **Start course** and opens the course's first video, and the page marks the
  learner as enrolled.
- Course manifests may declare `outcomes` (a list of sentences) and `sounds` (IPA vowels and
  consonants). The `Course` entity carries both; a course that declares none renders neither section.
  Outcomes are written for all three courses; sounds for the Basic Course and the Atlas of American
  Sounds.
- A course's **description and outcomes are translated**. Manifests may declare `translations`
  keyed by locale, each with a `description` and `outcomes`; every surface that shows them (the
  course page, the home's levels table, the onboarding's first-course step, the course's metadata,
  share image and structured data) shows the active locale's copy and falls back to the manifest's
  own when a locale has none. All three courses are translated to Spanish and Portuguese. Titles of
  courses, lessons and videos stay as declared.
- **Preview course** keeps its link; its spec wording changes from "opens its overview" to "opens its
  course page".

## Capabilities

### New Capabilities

- `course-detail-page`: the page a learner sees for a course they have not joined — what decides
  whether it or the progress board renders, what it shows, and how enrolling from it behaves.

### Modified Capabilities

- `course-content-storage`: manifests may declare a course's outcomes and the sounds it teaches, and
  translations of its description and outcomes, which every surface shows in the active locale.
- `cinema-course-overview`: the progress board renders only for a learner enrolled in the course when
  they arrive.
- `available-courses`: **Preview course** opens the course page rather than the progress board.

## Non-goals

- Making the course routes public. They stay behind the session and profile checks; whether a shared
  link should sell a course before sign-up is a separate decision.
- Showing outcomes on the progress board for enrolled learners.
- Translating course, lesson and video titles. Only the description and the outcomes, the course's
  prose, are translated; titles stay as the manifest declares them.
- Previewing a video without enrolling. Opening a lesson already enrolls the learner
  (`course-enrollment`), so the page offers no "watch first" action before enrollment.
- Leaving a course. Enrollment stays one-way.

## Impact

- **Route**: `src/app/[locale]/courses/[courseSlug]/page.tsx` renders a client switch between the new
  page and the existing `CourseOverview`.
- **Domain**: `Course` gains optional `outcomes` and `sounds`; `flattenCourseManifests` passes them
  through.
- **Adapters**: `CourseManifest` schema gains the two optional fields.
- **Content**: `src/content/*.json` gain `outcomes` and `translations` (es, pt); Basic and the Atlas
  gain `sounds`.
- **Localized copy**: a pure `courseCopy(course, locale)` in `src/lib/course-copy/` picks the
  description and outcomes; the levels table, first-course step, course metadata, share image and
  `courseSchema` read through it.
- **Components** (each with stories, tests, JSDoc, `Components.*` messages in en/es/pt): the page, its
  hero, outcomes list, sound strip, syllabus, enroll card, enroll action, bottom bar and the route
  switch.
- **Lib**: a pure `studyPace` helper for the pace line.
- **E2E**: a new spec for the page; existing specs that open a course the fixture learner has not
  joined are re-checked.
- No new dependencies.
