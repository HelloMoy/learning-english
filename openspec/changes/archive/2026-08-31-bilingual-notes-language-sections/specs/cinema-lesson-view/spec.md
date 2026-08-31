## MODIFIED Requirements

### Requirement: Notes tab shows a bilingual split; Transcript is present but disabled

The center column SHALL render a Notes tab and a Transcript tab. The Notes tab SHALL split the lesson's bilingual `readme.md` into two labelled columns ("Español" and "English") using a pure presentational splitter, falling back to a single column when the content cannot be split cleanly. Notes SHALL render through the existing safe Markdown component (no raw HTML). The Transcript tab SHALL be present for visual parity but disabled (`aria-disabled`), showing a localized "not available" state, since no transcript data exists.

The splitter SHALL identify each language by an explicit **level-2 language section heading** — a `##` heading (not `###` or deeper) whose text names the language, in either language's own words (for example `## Español`, `## 🇪🇸 Español`, `## English`, `## Inglés`). A language section SHALL run from its heading until the next level-2 heading or the end of the document. Content before the first level-2 heading — the lesson's `#` title — SHALL be discarded, and a level-2 section whose heading names no language SHALL be ignored. The splitter SHALL NOT infer languages by counting blank-line-separated blocks, so a lesson MAY nest `###` and `####` sub-headings, lists, blockquotes and examples inside a language section without losing its columns.

The language heading itself SHALL be dropped from the rendered column body, because the Notes tab already renders its own "Español" / "English" column label above each column. Everything else inside the section SHALL be preserved verbatim and rendered as Markdown.

Notes that carry exactly one language section SHALL render in a single column containing that section's body, with the language heading dropped. Notes with no language section at all SHALL render the original Markdown in a single column, so notes never render broken.

#### Scenario: Notes split into ES/EN columns

- **WHEN** a lesson's notes contain a `## Español` section followed by a `## English` section
- **THEN** the Notes tab shows two labelled columns with the Spanish section's body under "Español" and the English section's body under "English", and neither column repeats its `##` language heading

#### Scenario: Nested sub-sections survive the split

- **WHEN** a language section contains `###` sub-headings, `####` sub-headings and bullet lists beneath its `##` language heading
- **THEN** that column renders every nested sub-heading and list item, and the notes still render as two columns

#### Scenario: The language sections may appear in either order

- **WHEN** a lesson's notes place the `## English` section before the `## Español` section
- **THEN** the Spanish section's body still renders under "Español" and the English section's body under "English"

#### Scenario: Monolingual notes render one column without the language marker

- **WHEN** a lesson's notes contain only a `## English` section
- **THEN** the Notes tab renders a single column with that section's body, and the `## English` heading is not shown

#### Scenario: Ambiguous notes fall back to one column

- **WHEN** the notes contain no level-2 language section heading
- **THEN** the Notes tab renders the markdown in a single column without error

#### Scenario: Transcript tab is disabled

- **WHEN** the user reaches the Transcript tab
- **THEN** it is marked disabled, cannot be activated to reveal transcript content, and shows a localized "transcript not available" message

#### Scenario: Notes render safely

- **WHEN** notes markdown contains embedded HTML
- **THEN** no raw HTML/script is injected into the document
