## MODIFIED Requirements

### Requirement: Lesson progress is listed as lesson cards

My learning SHALL list, for the continued course — or the first catalog course when nothing is
continued — the course title, its completed and total video counts, and one card per module. Each card
SHALL show the module's ordinal, title, a progress ring labelled with the module's completed share as a
whole, locale-formatted percentage, and its completed-of-total video count. The ring SHALL be the same
progress ring the course overview draws. Counts SHALL use the same completion rule as the course
overview, and before hydration every ring SHALL read 0%.

Every card SHALL open its module's overview (`/[locale]/courses/<course>/modules/<module>`).

When a lesson is continued, the card of the module holding it SHALL come first and span the list's
width, marked `Current`, naming the last watched video, and SHALL be the only card offering a
**Continue** action, which opens that video. The other cards SHALL follow in `sequence` order. When
nothing is continued, every card SHALL render in `sequence` order and none SHALL offer Continue.

#### Scenario: The continued module leads with Continue
- **WHEN** the continued lesson is a video of the second module
- **THEN** the second module's card is first, marked Current, names that video, and its Continue action opens the video; no other card offers Continue

#### Scenario: Nothing continued offers no Continue
- **WHEN** no lesson is continued
- **THEN** the cards follow `sequence` order and no card offers Continue

#### Scenario: A card opens its module overview
- **WHEN** the learner activates the third module's card
- **THEN** they land on that module's overview for the active locale

#### Scenario: A finished module reads as complete
- **WHEN** every video of a module is complete
- **THEN** its ring reads 100%

#### Scenario: A card's ring fills to the module's share
- **WHEN** one of a module's three videos is complete
- **THEN** its card's ring fill covers a third of the circle and its label reads 33%
