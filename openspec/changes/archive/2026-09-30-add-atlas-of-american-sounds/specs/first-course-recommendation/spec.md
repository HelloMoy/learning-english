## MODIFIED Requirements

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
