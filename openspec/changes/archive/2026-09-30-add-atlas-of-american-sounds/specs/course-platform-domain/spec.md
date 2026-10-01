## MODIFIED Requirements

### Requirement: `Course` carries an explicit catalog sequence

`Course` SHALL have a `sequence` field: a positive integer that fixes the course's place in the catalog, mirroring `Module.sequence`. Catalog order SHALL be derived from this field and never from the order an adapter happens to return rows in. `sequence` orders every course, level and reference alike; it SHALL NOT be read as a level number.

`CourseRepository.listAvailable()` SHALL return courses in ascending `sequence` order, so downstream use cases do not re-sort — the same guarantee `ModuleRepository.listByCourse` already gives for modules.

#### Scenario: Course schema accepts a sequence
- **WHEN** a `Course` object with `sequence: 1` is passed to `Course.parse`
- **THEN** parsing succeeds and the resulting object exposes `sequence`

#### Scenario: Course schema rejects a non-positive sequence
- **WHEN** a `Course` object with `sequence: 0` or a fractional `sequence` is parsed
- **THEN** parsing fails with a Zod error

#### Scenario: `listAvailable` returns courses in sequence order
- **WHEN** an adapter holds courses stored at sequences 2 and 1, in that order
- **THEN** `listAvailable()` resolves to the sequence-1 course followed by the sequence-2 course

#### Scenario: A reference course is ordered like any other
- **WHEN** an adapter holds a level course at sequence 1 and a reference course at sequence 2
- **THEN** `listAvailable()` resolves to the level course followed by the reference course

## ADDED Requirements

### Requirement: `Course` declares whether it is a level or a reference

`Course` SHALL have a `track` field whose value is `level` or `reference`. A `level` course is a rung
of the ordered path through the catalog; a `reference` course is studied at any point and is not a
rung. The domain SHALL treat `track` as required; defaulting it is the adapter's concern.

#### Scenario: Course schema accepts both tracks
- **WHEN** `Course` objects with `track: "level"` and `track: "reference"` are parsed
- **THEN** both parse and expose their `track`

#### Scenario: Course schema rejects an unknown track
- **WHEN** a `Course` object with `track: "elective"` or no `track` is parsed
- **THEN** parsing fails with a Zod error

### Requirement: The catalog derives each course's standing

Each `findCourseCatalog()` entry SHALL carry the course's **standing**:

- for a `level` course, a level whose number is the course's 1-based position among the catalog's
  level courses in `sequence` order;
- for a `reference` course, a reference standing with no number.

The level number SHALL be derived, never declared and never equal to `sequence` by construction. A
reference course placed between two level courses SHALL NOT open a gap in the level numbers. The
derivation SHALL be a pure function of the listed courses and SHALL add no repository call.

#### Scenario: Levels number consecutively around a reference
- **WHEN** the catalog lists a level course at sequence 1, a reference course at sequence 2 and a
  level course at sequence 3
- **THEN** their standings are level 1, reference and level 2

#### Scenario: Today's catalog keeps its numbers
- **WHEN** the catalog lists the Basic Course (sequence 1), the Advanced Intermediate Course
  (sequence 2) and the Atlas of American Sounds (sequence 3, reference)
- **THEN** their standings are level 1, level 2 and reference

### Requirement: The first course is the first level course

The application SHALL treat the level course with standing level 1 as "the first course" wherever
it names or starts one: the home hero's note, the learner card's level line, the home's first-lesson
link, the onboarding recommendation and the fallback recommendation on Available courses. A reference
course SHALL never be the first course, whatever its `sequence`.

#### Scenario: A reference course declared first is not the first course
- **WHEN** a reference course holds the lowest `sequence` in the catalog
- **THEN** the first course is still the level-1 course
