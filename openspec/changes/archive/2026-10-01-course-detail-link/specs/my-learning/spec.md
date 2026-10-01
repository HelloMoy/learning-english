## ADDED Requirements

### Requirement: The progress panel's course title opens the course overview

The course title in My learning's progress panel SHALL link to the course overview, the same page as
the panel's **View course** link. The title link SHALL be left out of the tab order so keyboard users
meet **View course** once, and the heading SHALL keep its level and text.

#### Scenario: Clicking the course title
- **WHEN** a learner whose hero leads with the Basic Course clicks the panel's `Basic Course` heading
- **THEN** the course overview at `/en/courses/basic-course` opens

#### Scenario: One tab stop
- **WHEN** a keyboard user tabs through the progress panel
- **THEN** focus lands on **View course** once and not on the title
