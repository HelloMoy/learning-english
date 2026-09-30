## MODIFIED Requirements

### Requirement: The home lists every catalog course as a row of an ordered levels table

The home SHALL render an `Available courses` section whose heading states how many levels
there are, followed by one row per **level** course in ascending `Course.sequence` order. No
level course SHALL be dropped, and no reference course SHALL be a row of the levels table or
be counted in its heading.

Each row SHALL show the course's localized level ordinal (`Level {number}`, the number being
the course's derived level), its title, its description, its lesson and video counts, and one
link to the course overview for the active locale.

When the catalog holds reference courses, the home SHALL list them after the levels table, in
their own localized section headed as reference material for any level. Each reference row
SHALL show a localized **Reference** label in place of the ordinal, with the same title,
description, counts and link a level row shows. When the catalog holds no reference course,
that section SHALL NOT render.

When the catalog is empty the section SHALL be replaced by a localized empty state.

#### Scenario: Every catalog course gets a row
- **WHEN** the catalog resolves two level courses
- **THEN** the levels table renders two rows in ascending `sequence` order, each linking to its own course overview

#### Scenario: Ordering is data, not arrival order
- **WHEN** the repository returns courses in an order that does not match their `sequence`
- **THEN** the rows still render in ascending `sequence` order

#### Scenario: Empty catalog degrades gracefully
- **WHEN** the catalog returns no entries
- **THEN** the home shows a localized empty state instead of an empty table

#### Scenario: Levels copy is localized
- **WHEN** the locale is `es`
- **THEN** the section heading, the ordinals, the counts and the row links render from `es.json`

#### Scenario: A reference course sits outside the levels
- **WHEN** the catalog resolves the Basic Course, the Advanced Intermediate Course and the Atlas of American Sounds
- **THEN** the heading reads `2 levels, in order`, the levels table holds two rows, and the Atlas renders after it labelled Reference, linking to its overview

#### Scenario: No reference course, no reference section
- **WHEN** the catalog resolves only level courses
- **THEN** no reference section renders
