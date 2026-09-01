## MODIFIED Requirements

### Requirement: Course overview renders modules as showcase cards

The course overview (`/[locale]/courses/[courseSlug]`) SHALL present the course header — title, description, and count pills for its modules and videos — followed by one full-width showcase card per module, listed in `sequence` order, one per row.

Each showcase card SHALL be preceded by its module ordinal (`Lesson N`) rendered **outside and above** the card, so the page reads as a numbered index whose ordering is legible independently of the card's contents.

Each card SHALL carry two panels:

- A **left panel** with the module title, a count line stating how many videos the module holds and their combined duration, and a call to action linking to that module's overview. The call to action SHALL be the panel's only playback-adjacent affordance: the panel SHALL NOT render a decorative play control beside it. An inert play circle competes with the real action for the same click and reads as the primary way to start watching, which it is not.
- A **right panel** with the module's leading lessons laid out as a **receding gallery**: landscape cards in `sequence` order, each narrower and darker than the one in front, sharing a single perspective rotation, overlapping slightly and each edged so one card is visibly distinct from the next. The gallery SHALL fill the width the panel affords it.

Gallery cards SHALL carry artwork only — no ordinal, no title, no runtime, no caption.

Because the gallery carries no text and names nothing, it is decorative: what it communicates — that the module holds several videos — the count line states outright, and every lesson it previews is named on the module overview one click away. It SHALL therefore be hidden from assistive technology, consistent with how the module overview treats its row thumbnails. Any disclosure of lessons beyond those shown SHALL remain outside the hidden region so it is still announced.

Cards SHALL be landscape and take their height from their width, so the artwork is never cropped to a portrait frame. A single card SHALL be bounded so that a one-lesson module does not stretch one image across the whole panel.

The `Season 1 · N episodes` heading and the per-module `Module` badge SHALL NOT be rendered.

#### Scenario: One showcase card per module in sequence
- **WHEN** the course resolves 10 modules
- **THEN** 10 showcase cards render in `sequence` order, each preceded by its ordinal `Lesson 1` through `Lesson 10`, and each card's call to action links to that module's overview for the active locale

#### Scenario: The left panel offers one action and no decorative play control
- **WHEN** a showcase card renders
- **THEN** its left panel shows the title, the count line and the call to action, and renders no play affordance beside that action

#### Scenario: The gallery shows real lesson artwork
- **WHEN** a module's leading lessons carry `poster` artwork
- **THEN** each card in the gallery displays that lesson's poster, so the gallery is visually distinct card to card rather than repeating one placeholder

#### Scenario: A lesson without artwork keeps the placeholder card
- **WHEN** a card renders for a lesson that has no `poster` — including any reading lesson, whose schema has no such field
- **THEN** the card shows the decorative gradient, and no broken or empty image is rendered

#### Scenario: The gallery reads in order
- **WHEN** a module's gallery renders
- **THEN** its cards follow `sequence` order, each is narrower and darker than the one in front of it, and the earliest lesson is the card nearest the viewer

#### Scenario: The gallery carries no text
- **WHEN** a module's gallery renders
- **THEN** no card shows a title, a runtime or an ordinal — the cards are artwork, and the module's own ordinal and counts live outside the gallery

#### Scenario: Plurality is stated as well as shown
- **WHEN** a card renders for a module holding 6 video lessons totalling 60 minutes
- **THEN** its count line states both the number of videos and the combined duration, so the card's meaning does not depend on the learner interpreting the gallery

#### Scenario: Long durations are expressed in hours
- **WHEN** a module's combined duration exceeds 60 minutes
- **THEN** the count line expresses it with an hours component rather than as a minute count alone

#### Scenario: The gallery is bounded and its remainder is disclosed
- **WHEN** a module holds more lessons than the gallery displays
- **THEN** the gallery shows the leading lessons in `sequence` order and the card discloses that further lessons exist, rather than silently implying the module holds only what is shown

#### Scenario: A single-lesson module renders without special casing
- **WHEN** a module holds exactly one lesson
- **THEN** its card renders with a one-card gallery and a count line stating one video, using the same layout as every other card

#### Scenario: The gallery is not announced
- **WHEN** a screen reader traverses a showcase card
- **THEN** the gallery is skipped entirely, and the module is announced through its heading, its count line and its call to action rather than through a run of unlabelled images

#### Scenario: The remainder stays announced even though the artwork does not
- **WHEN** a module holds more lessons than the gallery shows
- **THEN** the disclosure of the remainder is reachable by assistive technology, because it sits outside the hidden gallery

#### Scenario: The gallery fills its panel without spilling
- **WHEN** a module contributes anywhere from one to a full complement of cards
- **THEN** the gallery spans the width the panel affords it and never overlaps the copy beside it, and a lone card is bounded rather than stretched across the whole panel

#### Scenario: Artwork is never cropped to portrait
- **WHEN** any gallery card renders
- **THEN** it is landscape and takes its height from its width, so a text-bearing poster is not sliced by a portrait frame

#### Scenario: Start course targets the first lesson
- **WHEN** a first lesson exists
- **THEN** a "Start course" action links to that lesson via the locale-aware lesson path

#### Scenario: Retired vocabulary is absent
- **WHEN** the course overview renders in any supported locale
- **THEN** no season heading, no episode label and no `Module` badge appears

#### Scenario: Course copy is localized
- **WHEN** the locale is `es` or `pt`
- **THEN** the module ordinals, count lines, call to action and "Start course" render from the matching message file
