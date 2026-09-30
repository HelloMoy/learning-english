# first-course-recommendation Specification

## Purpose
TBD - created by archiving change course-enrollment-views. Update Purpose after archive.
## Requirements
### Requirement: Step three recommends the first catalog course

The route `/[locale]/start/first-course` SHALL render onboarding step 3 for a signed-in learner with a profile. It SHALL show:

- the heading "Your first course, {first name}" and a short intro;
- the first **level** course (derived level 1) in an artwork hero; a reference course SHALL never be recommended here, whatever its `sequence`. The hero shows:
  - its first video's poster;
  - a **Recommended for you** mark;
  - the line "Level N · M modules · V videos";
  - its title and description;
- a **What you'll learn** panel listing every module of that course with its two-digit ordinal and title, followed by its video count, total runtime and prize count.

It SHALL NOT offer to choose between courses, and SHALL NOT offer a way to dismiss the recommendation other than the two actions below.

#### Scenario: A new learner sees the Basic Course recommended
- **WHEN** Ana finishes step 2 and step 3 opens
- **THEN** the page reads `Your first course, Ana` and shows the Basic Course marked Recommended for you with its five modules

#### Scenario: No choice between courses
- **WHEN** step 3 renders
- **THEN** no other course is offered on it, and no Not now action exists

#### Scenario: A reference course is never recommended first
- **WHEN** the catalog holds a reference course with a lower `sequence` than every level course
- **THEN** step 3 still recommends the level-1 course

### Requirement: Starting the recommended course enrolls and opens its first video

The primary action SHALL read **Start the {course title}**. Activating it SHALL enroll the learner in that course through the client enrollment and SHALL navigate to the course's first video. A secondary **See all courses** link SHALL open `/[locale]/courses` without enrolling.

#### Scenario: Start enrolls and opens the first lesson
- **WHEN** the learner activates Start the Basic Course
- **THEN** the Basic Course's first video opens and the learner is enrolled in `basic-course`

#### Scenario: See all courses does not enroll
- **WHEN** the learner activates See all courses
- **THEN** Available courses opens and the learner's enrollments are unchanged

### Requirement: Step three is guarded and reachable from My learning

After hydration, the step SHALL replace itself with `/[locale]/start` when no profile exists. It SHALL show the onboarding progress indicator at step 3 of 3, except when the URL carries `from=learning`, the marker the My learning redirect adds for a learner who is not in the middle of onboarding. Until the profile is known the step SHALL render a placeholder of its shape.

#### Scenario: No profile goes back to step one
- **WHEN** a signed-in learner without a profile opens `/en/start/first-course`
- **THEN** they land on `/en/start`

#### Scenario: Arriving from My learning hides the step indicator
- **WHEN** the step opens at `/en/start/first-course?from=learning`
- **THEN** the recommendation renders without the "Step 3 of 3" indicator

### Requirement: Step three copy is localized

Every string of the step SHALL come from the active locale's messages in `en`, `es` and `pt`.

#### Scenario: Step three in Portuguese
- **WHEN** `/pt/start/first-course` renders
- **THEN** the heading, intro, marks, panel title, actions and note render from `pt.json`

