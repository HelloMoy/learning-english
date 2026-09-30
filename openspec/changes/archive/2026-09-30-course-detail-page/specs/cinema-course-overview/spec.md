## ADDED Requirements

### Requirement: The progress board is for learners enrolled in the course

The course overview's progress board SHALL render only for a learner who is enrolled in the course when the learner store is first
seeded on the route; the board is the continue tile, the course progress tile and the lesson ring
tiles. Any other learner SHALL see the course page (`course-detail-page`) instead. The
board's own requirements are unchanged when it renders.

#### Scenario: Enrolled on arrival
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course`
- **THEN** the continue tile, the course progress tile and one ring tile per lesson render

#### Scenario: Not enrolled on arrival
- **WHEN** a learner not enrolled in `atlas-of-american-sounds` opens its route
- **THEN** no continue tile and no ring tile render, and the course page does
