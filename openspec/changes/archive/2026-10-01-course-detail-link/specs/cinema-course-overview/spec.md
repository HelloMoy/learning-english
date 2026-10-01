## ADDED Requirements

### Requirement: The course progress tile leads to the course page

On the progress board, the course progress tile SHALL end with a **View course details** link to the
course page's own route (`/[locale]/courses/[courseSlug]/about`, `course-detail-page`) through the
locale-aware path, beneath the prizes. The course title SHALL link to the same page; that link SHALL
be left out of the tab order so keyboard users meet one link, not two, and the heading SHALL keep
its level and text. Both links SHALL render on the server and before progress is known, since they
depend on no progress. The link text SHALL read **Ver detalle del curso** in `es` and **Ver detalhes
do curso** in `pt`.

#### Scenario: The board links to the course page
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course`
- **THEN** the course progress tile shows **View course details** linking to `/en/courses/basic-course/about`

#### Scenario: The title links to the course page
- **WHEN** the learner clicks the `Basic Course` heading in the course progress tile
- **THEN** the course page opens at `/en/courses/basic-course/about`

#### Scenario: One tab stop
- **WHEN** a keyboard user tabs through the course progress tile
- **THEN** focus lands on **View course details** once and not on the title

#### Scenario: Spanish board
- **WHEN** the board renders under `/es`
- **THEN** the link reads **Ver detalle del curso** and points to `/es/courses/basic-course/about`

#### Scenario: Before progress is read
- **WHEN** the board renders on the server
- **THEN** **View course details** is present while the ring shows no percentage
