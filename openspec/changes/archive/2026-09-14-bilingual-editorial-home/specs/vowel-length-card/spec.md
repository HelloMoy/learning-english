## ADDED Requirements

### Requirement: The card contrasts the vowels of ship and sheep

The home SHALL render a vowel-length card that contrasts the English words *ship* and
*sheep*. Each word SHALL appear on its own row with its vowel letters visually
emphasized (`i` in *ship*, `ee` in *sheep*), its IPA transcription (`/ʃɪp/`, `/ʃip/`),
a duration bar whose track length expresses the vowel's relative length (short for
*ship*, long for *sheep*), and a localized label describing the vowel
(`Short · relaxed`, `Longer · tense, lips spread` in `en`).

The card SHALL include a localized anchor note that relates both vowels to words of a
language the learner already speaks: Spanish words in `en` and `es`, Portuguese words in
`pt`.

The English words and their IPA SHALL NOT be translated. Every other visible string and
every accessible name SHALL come from the active locale's messages.

#### Scenario: Both words render with their transcriptions
- **WHEN** the card renders in any locale
- **THEN** it shows *ship* with `/ʃɪp/` and *sheep* with `/ʃip/`, and the track for *sheep* is longer than the track for *ship*

#### Scenario: The anchor note speaks the learner's language
- **WHEN** the card renders under `es`
- **THEN** the anchor note is written in Spanish and compares the vowels to Spanish words; under `pt` it is written in Portuguese and compares them to Portuguese words

#### Scenario: The English words are not translated
- **WHEN** the card renders under `pt`
- **THEN** the words read *ship* and *sheep* and the transcriptions are unchanged

### Requirement: Each word plays its own recording

Each row SHALL offer a button that plays that word's recording. The button's accessible
name SHALL name the word (`Play ship`), localized around the untranslated word, and its
hit area SHALL be at least 44×44 CSS pixels.

While a word is playing, its button SHALL expose a pressed state
(`aria-pressed="true"`), SHALL show a playing glyph in place of the play glyph, and the
word's duration bar SHALL show a fill. When the recording ends the row SHALL return to
its idle state.

#### Scenario: Pressing a word plays it
- **WHEN** the learner presses `Play sheep`
- **THEN** the *sheep* recording starts, the button reports `aria-pressed="true"`, and the *sheep* bar shows its fill

#### Scenario: The row returns to idle when the clip ends
- **WHEN** the *sheep* recording finishes
- **THEN** the button reports `aria-pressed="false"` and the bar's fill is removed

### Requirement: Play both plays the pair in order

The card SHALL offer a `Play both` control that plays *ship* and then *sheep*, with a
short pause between them, reflecting each word's playing state in turn.

#### Scenario: The pair plays in sequence
- **WHEN** the learner presses `Play both`
- **THEN** *ship* plays first with its row in the playing state, and when it ends *sheep* plays with its row in the playing state

### Requirement: Starting a recording interrupts the one playing

At most one recording SHALL play at a time. Starting any recording — a word or
`Play both` — SHALL stop the recording in progress and cancel any remaining part of a
`Play both` sequence.

#### Scenario: A second press replaces the first
- **WHEN** *sheep* is playing as part of `Play both` and the learner presses `Play ship`
- **THEN** *sheep* stops, *ship* plays, and *sheep* does not play again afterwards

### Requirement: A recording that cannot play leaves the card idle

When the browser refuses to play a recording, the card SHALL return that row to its idle
state, SHALL continue with nothing else, and SHALL NOT render an error or throw.

#### Scenario: A refused clip does not break the card
- **WHEN** the learner presses `Play ship` and the browser rejects playback
- **THEN** every row is idle and both buttons remain operable

### Requirement: The card has two labels for two audiences

The card SHALL accept a variant: `hear-the-difference` for a new visitor and
`quick-review` for a returning learner. The variants SHALL differ only in the card's
eyebrow text; content and behaviour are identical.

#### Scenario: The returning variant relabels the card
- **WHEN** the card renders with the `quick-review` variant under `en`
- **THEN** its eyebrow reads `Quick review` and every other element is the same as the `hear-the-difference` variant

### Requirement: The recordings are static US English assets

The recordings SHALL be static files served from `public/audio/minimal-pairs/` — one per
word, named after the word (`ship.mp3`, `sheep.mp3`) — spoken in US English. The card
SHALL reference them by those paths and SHALL NOT synthesize speech in the browser.

#### Scenario: Each word has a file
- **WHEN** the application is built
- **THEN** `public/audio/minimal-pairs/ship.mp3` and `public/audio/minimal-pairs/sheep.mp3` exist and the card's buttons play them

### Requirement: Motion respects the reduced-motion preference

The duration bar's fill animation SHALL be disabled when the user prefers reduced
motion. The playing state SHALL still be conveyed by the pressed state and the glyph.

#### Scenario: Reduced motion keeps the state without the animation
- **WHEN** the user prefers reduced motion and presses `Play ship`
- **THEN** the fill appears without animating and the button still reports `aria-pressed="true"`
