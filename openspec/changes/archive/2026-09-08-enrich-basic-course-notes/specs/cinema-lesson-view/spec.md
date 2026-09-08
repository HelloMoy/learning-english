## ADDED Requirements

### Requirement: Lesson notes Markdown renders with a theme-owned typographic hierarchy

The Markdown renderer used by the Lesson Page's Notes tab SHALL apply its own element
styling, declared alongside the renderer, so that a notes body's structure is visible without
depending on any Tailwind plugin the build does not generate.

The renderer SHALL give distinct, visible treatment to at least: level-1 through level-4
headings, paragraphs, unordered and ordered lists and their items, blockquotes, strong and
emphasized text, inline code, and horizontal rules. Headings SHALL descend in visual weight
so a `###` sub-heading reads as subordinate to the section around it, and block elements
SHALL carry vertical rhythm so consecutive paragraphs and list items do not run together.

Styling SHALL be expressed with the project's Immersion Cinema theme tokens (`foreground`,
`muted-foreground`, `gold`, `border`) rather than a generic prose palette, and SHALL be
readable in the app's dark surface without a separate inverted variant.

`LessonNotesTabs` SHALL NOT carry typography class names of its own for the notes body. The
Notes tab's only styling responsibility is the column layout and the "Español" / "English"
column labels; how a heading or a list looks belongs to the renderer.

The renderer SHALL continue to reject raw HTML embedded in a notes body.

#### Scenario: A notes heading is visually distinct from body text

- **WHEN** a notes body contains a `###` sub-heading followed by a paragraph
- **THEN** the rendered heading element carries styling that sets it apart from the paragraph — it is not left at the browser's default rendering

#### Scenario: Lists and blockquotes render as structured blocks

- **WHEN** a notes body contains a bullet list and a blockquote
- **THEN** the list renders with visible markers and indentation and the blockquote renders with its own visual treatment, both distinguishable from surrounding paragraphs

#### Scenario: The Notes tab delegates typography to the renderer

- **WHEN** the Notes tab renders a lesson's notes
- **THEN** the container it puts the Markdown in carries no typography class names; the styling comes from the Markdown renderer itself

#### Scenario: Styled Markdown still blocks raw HTML

- **WHEN** a notes body contains embedded HTML such as a `<script>` or an `<img onerror=…>`
- **THEN** no raw HTML element is injected into the document
