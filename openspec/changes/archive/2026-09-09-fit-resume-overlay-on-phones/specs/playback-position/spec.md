## ADDED Requirements

### Requirement: The resume overlay stays fully readable inside the player at every viewport

The resume overlay SHALL be **wholly visible within the player's box**, not merely
painted over it. At every viewport the application supports, from 320px wide upward, the
overlay's card SHALL lie entirely within those bounds, so no part of the offer is clipped
by the player or by any ancestor that hides its overflow.

This matters because the player is 16:9 and therefore only about 202px tall at a 390px
viewport, where a card laid out for a desktop column does not fit.

Where the card cannot hold every element at a given size, it SHALL drop the elements
that only restate the offer — the prose description, and the heading whose content the
timestamped action already carries — rather than overflow. The **timestamped resume
action and the restart alternative SHALL survive at every size**, because they are the
choice itself.

Anything the card stops painting SHALL remain available to assistive technology, so the
dialog keeps the accessible name and description the capability already requires and a
screen-reader user is offered exactly what a sighted one is.

As a last resort, if the card's content would still exceed the player's height, the card
SHALL scroll within itself rather than be clipped by an ancestor.

Nothing in this requirement changes when the overlay is offered, what its actions do, or
the fact that it is not a modal.

#### Scenario: The card fits inside the player on a phone
- **WHEN** the overlay is open on a lesson page at a 390px viewport
- **THEN** the card's top and bottom edges both lie within the player's box, and the
  dialog's heading is not cut off

#### Scenario: The card fits at the narrowest supported viewport
- **WHEN** the overlay is open at a 320px viewport
- **THEN** the card still lies entirely within the player's box

#### Scenario: The choice survives the compact form
- **WHEN** the overlay renders in its compact form
- **THEN** both the "Resume from `MM:SS`" action and the "Restart from beginning"
  alternative are present and operable, and the timestamp is legible

#### Scenario: The dialog keeps its accessible name when the heading is not painted
- **WHEN** the overlay renders in its compact form
- **THEN** the dialog still exposes the same accessible name and description it exposes
  at desktop sizes

#### Scenario: The desktop presentation is unchanged
- **WHEN** the overlay is open at a desktop viewport
- **THEN** the heading, the description, the timestamped action and the restart
  alternative are all painted, exactly as before
