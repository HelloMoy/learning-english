# Delta: cinema-home — the header's controls share one chip

## ADDED Requirements

### Requirement: The header's controls share one chip treatment

The header's controls SHALL be presented as one set rather than as individually styled elements. The install control, the locale control and the account trigger SHALL each render as a rounded-square chip carrying a border, a faint fill over the page, and the same hover and focus transitions, at a minimum of 44×44 CSS pixels.

A control whose whole content is a glyph SHALL centre that glyph, and all such glyphs SHALL render at the same size, so two icon chips side by side read as siblings rather than as two different kinds of thing.

The learner's avatar is exempt and SHALL keep its round frame. It is a portrait rather than a control — it carries a face or a learner's initials, and its shape is what distinguishes the person from the controls standing next to them.

#### Scenario: The account trigger is a chip like its neighbours
- **WHEN** the header renders at a phone-class width for a visitor with no session, beside the install control
- **THEN** the account trigger carries the same chip treatment — border, fill, rounded-square corners and hover transition — and its glyph renders at the same size as the install control's

#### Scenario: The chip treatment does not change the row's budget
- **WHEN** the account trigger is presented as a chip rather than as a bare glyph
- **THEN** it occupies the same 44×44 footprint, so the widths that let the wordmark render whole are unaffected

#### Scenario: The avatar is a portrait, not a chip
- **WHEN** the header renders for a learner whose card is known
- **THEN** the avatar trigger keeps its round frame rather than taking the chip treatment
