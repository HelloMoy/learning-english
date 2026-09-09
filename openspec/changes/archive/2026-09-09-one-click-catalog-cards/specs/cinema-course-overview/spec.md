## ADDED Requirements

### Requirement: A showcase card is clickable across its whole area

A module showcase card presents itself as one object — a bordered panel with its own glow, a hover-lit title and a receding gallery — so a pointer landing anywhere inside it SHALL navigate to that module's overview, not only a pointer landing on the `View videos` button.

The extended hit area SHALL be an extension of the existing call to action, not a new control. The card SHALL therefore expose no additional link to assistive technology and add no tab stop: the number of announced and tabbable links per card SHALL be unchanged, and the card's accessible name SHALL remain the module title rather than the whole panel's text.

Text inside the card SHALL remain selectable-looking and readable; the extended hit area SHALL sit above the decorative gallery so that a click on the artwork navigates like any other part of the card.

#### Scenario: Clicking the card body opens the module
- **WHEN** the user clicks the card's count line, its progress meter's surrounding space, or the gallery artwork
- **THEN** they navigate to that module's overview for the active locale — the same destination as the `View videos` action

#### Scenario: The hit area adds no control
- **WHEN** a screen reader or keyboard user traverses a showcase card
- **THEN** the same links are announced and reachable as before the hit area was extended — the module heading and its call to action — and the card itself is not announced as a link

#### Scenario: The card's accessible name stays the module title
- **WHEN** assistive technology reports the card's call to action
- **THEN** its name is the action's own label and the heading's name is the module title, neither swallowing the count line, the meter or the gallery

#### Scenario: The gallery stays non-interactive
- **WHEN** the hit area is extended over the receding gallery
- **THEN** the gallery's cards remain hidden from assistive technology and contribute no links of their own
