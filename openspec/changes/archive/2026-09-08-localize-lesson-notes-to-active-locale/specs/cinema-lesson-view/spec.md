## MODIFIED Requirements

### Requirement: Notes tab shows the active locale's notes; Transcript is present but disabled

The center column SHALL render a Notes tab and a Transcript tab. The Notes tab SHALL render the lesson's notes in **exactly one language — the app's active locale** — as a single full-width column, using a pure presentational selector over the lesson's `readme.md`. It SHALL NOT render two languages at the same time. Notes SHALL render through the existing safe Markdown component (no raw HTML). The Transcript tab SHALL be present for visual parity but disabled (`aria-disabled`), showing a localized "not available" state, since no transcript data exists.

The active locale SHALL be the one `next-intl` reports for the current request — the same locale the header's language control sets — so switching the app's language switches the notes with it. The Notes tab SHALL NOT offer a language control of its own.

The selector SHALL identify each language by an explicit **level-2 language section heading** — a `##` heading (not `###` or deeper) whose text names the language, in any of the three locales' own words and with or without a flag emoji (for example `## Español`, `## 🇪🇸 Español`, `## Spanish`, `## English`, `## 🇺🇸 English`, `## Inglés`, `## Português`, `## 🇧🇷 Português`, `## Portuguese`). A language section SHALL run from its heading until the next level-2 heading or the end of the document. Content before the first level-2 heading — the lesson's `#` title — SHALL be discarded, and a level-2 section whose heading names no recognized language SHALL be ignored. The selector SHALL NOT infer languages by counting blank-line-separated blocks, so a lesson MAY nest `###` and `####` sub-headings, lists, blockquotes and examples inside a language section without losing its content.

When the notes carry no section for the active locale, the selector SHALL resolve in this order and render the first section it finds: **active locale → English → Spanish**. When the notes carry no recognized language section at all, the Notes tab SHALL render the original Markdown unchanged. Notes therefore never render empty and never render broken.

The language heading itself SHALL be dropped from the rendered body. Everything else inside the section SHALL be preserved verbatim and rendered as Markdown. The Notes tab SHALL NOT render a language label above the body — the panel is already in the language the learner selected, so a label would state what the app's own language control states.

#### Scenario: Spanish notes render for a Spanish learner
- **WHEN** a lesson whose notes carry `## 🇪🇸 Español`, `## 🇺🇸 English` and `## 🇧🇷 Português` sections is opened under the `es` locale
- **THEN** the Notes tab shows the Spanish section's body alone, occupying the full width, with no English or Portuguese text and no "ESPAÑOL" / "ENGLISH" column labels

#### Scenario: English notes render for an English learner
- **WHEN** the same lesson is opened under the `en` locale
- **THEN** the Notes tab shows the English section's body alone, and neither the Spanish nor the Portuguese body appears in the panel

#### Scenario: Portuguese notes render for a Portuguese learner
- **WHEN** the same lesson is opened under the `pt` locale
- **THEN** the Notes tab shows the Portuguese section's body alone, and neither the Spanish nor the English body appears in the panel

#### Scenario: Switching the app's language switches the notes
- **WHEN** the learner changes the app's language from Spanish to Portuguese while on a lesson page
- **THEN** the Notes tab body is the Portuguese section, without the learner touching any control inside the panel

#### Scenario: A missing locale section falls back to English
- **WHEN** a lesson's notes carry only `## Español` and `## English` sections and the lesson is opened under the `pt` locale
- **THEN** the Notes tab shows the English section's body alone, rather than an empty panel or two columns

#### Scenario: A missing locale and missing English fall back to Spanish
- **WHEN** a lesson's notes carry only a `## Español` section and the lesson is opened under the `pt` locale
- **THEN** the Notes tab shows the Spanish section's body

#### Scenario: The language heading is never shown
- **WHEN** any language section is rendered
- **THEN** its `##` language heading is not present in the panel, and the section's own `###` sub-headings are the first headings the learner sees

#### Scenario: Nested sub-sections survive the selection
- **WHEN** the selected language section contains `###` sub-headings, `####` sub-headings and bullet lists beneath its `##` language heading
- **THEN** the panel renders every nested sub-heading and list item

#### Scenario: The language sections may appear in any order
- **WHEN** a lesson's notes place the `## English` section before the `## Español` section
- **THEN** the locale still selects its own section, unaffected by the order the sections appear in the file

#### Scenario: Ambiguous notes fall back to the whole body
- **WHEN** the notes contain no level-2 language section heading
- **THEN** the Notes tab renders the markdown as-is in a single column without error

#### Scenario: Transcript tab is disabled
- **WHEN** the user reaches the Transcript tab
- **THEN** it is marked disabled, cannot be activated to reveal transcript content, and shows a localized "transcript not available" message

#### Scenario: Notes render safely
- **WHEN** notes markdown contains embedded HTML
- **THEN** no raw HTML/script is injected into the document

## RENAMED Requirements

- FROM: `### Requirement: Notes tab shows a bilingual split; Transcript is present but disabled`
- TO: `### Requirement: Notes tab shows the active locale's notes; Transcript is present but disabled`
