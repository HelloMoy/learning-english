## ADDED Requirements

### Requirement: The resolved panel reports the lesson's place in its module

The home's resolved panel SHALL carry the course slug, the module id, the module's
`sequence` and the lesson's `sequence`, so the home can state the lesson's position and key
the course in progress without another round-trip. The module's lesson count SHALL be
derived by the home from the catalog it already holds.

Resolving a stored location SHALL continue to load only the course, the module and the
lesson it names; it SHALL NOT enumerate the course's other lessons to report the module's
lesson count.

#### Scenario: The panel carries the lesson's position
- **WHEN** a stored location resolves to the sixth lesson of the second module
- **THEN** the resolved panel reports a lesson `sequence` of 6, a module `sequence` of 2 and that module's id

#### Scenario: The panel identifies the course by slug
- **WHEN** a stored location resolves
- **THEN** the resolved panel carries the slug of the course the lesson belongs to

#### Scenario: Resolution does not enumerate the course
- **WHEN** a stored location is resolved
- **THEN** the course's lesson listing is not read

## MODIFIED Requirements

### Requirement: The home offers to continue the last lesson

The home SHALL offer to continue the last lesson through its returning-learner hero when,
and only when, a stored location resolves to a live lesson. The hero SHALL show the course
and module the lesson belongs to, the lesson's position in its module, the lesson title,
and a primary action that navigates to that lesson.

That action SHALL be the hero's only playback affordance. The hero SHALL NOT render a
decorative play control alongside it — an inert circle bearing a play glyph invites a
click it cannot answer, and next to a working `Resume` action it makes the hero appear to
offer two ways in when it offers one. The vowel-length card's word buttons play audio
clips, not the lesson, and are not playback affordances for the lesson.

When the lesson is a video lesson with a saved playback position, the hero SHALL
additionally show how far through it the learner is. When there is no saved position, or
the lesson has no duration, the progress indicator SHALL be omitted rather than rendered
at zero.

Resolving a stored location requires a server round-trip, and until it answers the hero
has nothing to show. During that window the hero SHALL be reserved with a placeholder of
the returning hero's own shape — position line, title line and action — when, and only
when, the client's read of the stored location returned one. Reserving on the record's
**existence** asserts only "there is something here, still resolving", which is true and
is known before the round-trip completes; it does not assert which lesson, how far in, or
that the record still resolves. Without a stored location nothing SHALL be reserved, so a
learner who has watched nothing sees the new-visitor home with no gap and no placeholder.

When the round-trip answers that the record no longer resolves, the placeholder SHALL be
replaced by the new-visitor hero.

All copy SHALL be localized (en/es/pt) and the link SHALL be locale-aware.

#### Scenario: Nothing to continue renders the new-visitor home
- **WHEN** no location is stored, or the stored location no longer resolves
- **THEN** the home renders its new-visitor hero, and no error message in place of a returning hero

#### Scenario: A stored location renders the returning hero
- **WHEN** a location resolves to a live lesson
- **THEN** the hero shows the course title, the module title, the lesson's position, the lesson title, and an action that navigates to that lesson for the active locale

#### Scenario: The hero offers one way in
- **WHEN** the returning hero renders for a resolved lesson
- **THEN** the action that navigates to the lesson is the only playback affordance for the lesson, and no decorative play control renders beside it

#### Scenario: A video lesson with a saved position shows progress
- **WHEN** the resolved lesson is a video lesson and a playback position is saved for it
- **THEN** the hero shows the elapsed proportion, derived from that position and the lesson's `durationSeconds`

#### Scenario: A reading lesson shows no progress bar
- **WHEN** the resolved lesson is a reading lesson
- **THEN** the hero renders without a progress indicator and still offers the action

#### Scenario: The hero resolves after hydration without asserting a false state
- **WHEN** the home is server-rendered, before `localStorage` can be read
- **THEN** the new-visitor hero is shown, and the returning hero appears only once the client has read and resolved the record

#### Scenario: A stored record reserves the hero while it resolves
- **WHEN** the client has read a stored location and the round-trip that resolves it has not answered
- **THEN** the hero shows a placeholder of the returning hero's shape, naming no lesson and showing no progress
