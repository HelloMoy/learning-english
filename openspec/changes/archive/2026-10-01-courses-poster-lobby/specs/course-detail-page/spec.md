## MODIFIED Requirements

### Requirement: The course page opens with a cinema hero

The course page SHALL open with a wide cinema hero: the course's
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

