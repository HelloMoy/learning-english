## ADDED Requirements

### Requirement: A video lesson may declare when it was published

A video lesson in a course manifest MAY declare an `uploadDate`. When present it SHALL be a calendar date, and it SHALL be carried through to the served lesson so delivery adapters can describe the video to search engines.

The field is optional by design. Making it required would force a date onto every existing lesson before anything could ship; leaving it out entirely would make correct `VideoObject` structured data impossible. Optional lets the catalog be dated lesson by lesson, and a lesson without a date is simply not described as a video.

#### Scenario: A manifest may omit the date
- **WHEN** a video lesson declares no `uploadDate`
- **THEN** the manifest is valid and the lesson is served as it always was

#### Scenario: A malformed date is refused loudly
- **WHEN** a video lesson declares an `uploadDate` that is not a calendar date
- **THEN** the manifest fails validation with a message naming the offending lesson
