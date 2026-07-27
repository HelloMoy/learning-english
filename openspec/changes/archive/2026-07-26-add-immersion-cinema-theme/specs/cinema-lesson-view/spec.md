## ADDED Requirements

### Requirement: Lesson view renders as a cinema player with tabbed notes

The Lesson Page SHALL present a three-column cinema layout: a left "Course outline" sidebar, a center column with a video hero (gold title overlay over the player, native controls/scrubber retained) followed by the lesson title, description, a Notes/Transcript tab pair, and a "Mark as complete" action; and a right rail with "Resources", "Lesson notes (source)", and an "Up next" card. All regions SHALL be landmarks or labelled, keyboard-reachable with visible focus, and localized. The existing `NativeVideoPlayer`, breadcrumb, resource list, up-next, and mark-complete behaviors SHALL be preserved.

#### Scenario: Video hero preserves the native player
- **WHEN** a video lesson renders
- **THEN** the gold title overlays the player, native playback controls remain operable, and Mark-as-complete stays reachable by keyboard with a visible focus ring

#### Scenario: Outline marks the current lesson
- **WHEN** the outline renders for the current lesson
- **THEN** the active module is expanded, the current lesson is marked current (`aria-current`), and other modules are reachable without expanding all 107 lessons

### Requirement: Notes tab shows a bilingual split; Transcript is present but disabled

The center column SHALL render a Notes tab and a Transcript tab. The Notes tab SHALL split the lesson's bilingual `readme.md` into two labelled columns ("Español" and "English") using a pure presentational splitter, falling back to a single column when the content cannot be split cleanly. Notes SHALL render through the existing safe Markdown component (no raw HTML). The Transcript tab SHALL be present for visual parity but disabled (`aria-disabled`), showing a localized "not available" state, since no transcript data exists.

#### Scenario: Notes split into ES/EN columns
- **WHEN** a lesson's notes contain a Spanish block followed by an English block
- **THEN** the Notes tab shows two labelled columns with the Spanish text under "Español" and the English text under "English"

#### Scenario: Ambiguous notes fall back to one column
- **WHEN** the notes cannot be split into two language blocks
- **THEN** the Notes tab renders the markdown in a single column without error

#### Scenario: Transcript tab is disabled
- **WHEN** the user reaches the Transcript tab
- **THEN** it is marked disabled, cannot be activated to reveal transcript content, and shows a localized "transcript not available" message

#### Scenario: Notes render safely
- **WHEN** notes markdown contains embedded HTML
- **THEN** no raw HTML/script is injected into the document
