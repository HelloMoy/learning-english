## ADDED Requirements

### Requirement: The Storybook manager wears Immersion Cinema dark

The Storybook manager (sidebar, toolbar and addon panel) SHALL use a dark theme whose colours are
the cinema-dark tokens declared under `.dark` in `src/app/globals.css`: the sidebar and toolbar
on `--sidebar`, content on `--background`, borders on `--border`, inputs on `--card`, text on
`--foreground` and `--muted-foreground`, and the selection and accent colour on `--gold`. Its fonts
SHALL be Geist and Geist Mono, and its brand SHALL be the `ENGLISH·COURSE` wordmark with the
middle dot in gold, tagged `DESIGN SYSTEM` in the same gold tag the API reference uses for `API`.

The theme SHALL NOT drift from the app: every colour it takes from a token MUST equal that token's
current `.dark` value, and a test MUST fail when they differ.

#### Scenario: The manager opens in cinema-dark

- **WHEN** someone opens Storybook
- **THEN** the sidebar, toolbar and addon panel render on the cinema-dark surfaces
- **AND** the selected sidebar item and the active toolbar tab are marked in gold `#e7b64c`
- **AND** the brand reads `ENGLISH·COURSE` with a gold middle dot, tagged `DESIGN SYSTEM`

#### Scenario: A token change is caught

- **WHEN** a colour in the `.dark` block of `globals.css` changes
- **AND** the manager theme still carries the old value for that token
- **THEN** a test fails naming the theme key and both values

### Requirement: Stories open in the app's default variant, on the app's backdrop

The story canvas SHALL render stories in the dark variant unless the reviewer picks light in the
toolbar, matching the application's default. In story view the canvas SHALL render the app's
`CinemaBackground` behind the story, so a component is reviewed on the surface it appears on in
the app, in whichever variant is selected.

Storybook's backgrounds picker SHALL be turned off, because its fixed swatches paint over the
backdrop and contradict the theme switch.

#### Scenario: A story opens dark on the cinema backdrop

- **WHEN** a reviewer opens any story without touching the toolbar
- **THEN** the canvas has the `.dark` class applied
- **AND** the cinema glow and letterbox scrim render behind the component

#### Scenario: Nothing flashes light while the preview loads

- **WHEN** the preview is loading a story or a docs page, with the default theme selected
- **THEN** it paints the dark variant from the first frame, before any story has mounted
- **AND** Storybook's loading skeleton is drawn in cinema-dark, not white

#### Scenario: The light variant is one click away

- **WHEN** the reviewer switches the toolbar theme to light
- **THEN** the story re-renders in the light tokens
- **AND** the backdrop re-renders in its light glow

#### Scenario: Docs view does not stack backdrops

- **WHEN** a component's stories are shown inline on its docs page
- **THEN** no story block renders its own full-viewport backdrop

#### Scenario: No background swatches compete with the theme

- **WHEN** the Storybook toolbar renders
- **THEN** it offers no backgrounds picker

### Requirement: Docs pages follow the toolbar and open the workshop

Docs pages SHALL be set on the app's cinema backdrop, as a story is in the canvas, and SHALL obey
the preview toolbar the way a story does:

- the theme switch SHALL move a docs page between cinema-dark and cinema-light, backdrop, text and
  blocks together, while the manager around it stays cinema-dark;
- the locale switch SHALL show the page's copy in English, Spanish or Portuguese. The copy SHALL
  live in the story message files (`.storybook/messages/<locale>.json`, under `Stories.Docs`),
  with every key present in every locale.

A `Docs` group SHALL sort first in the sidebar and SHALL contain, in this order:

- `Docs/Welcome`, which Storybook opens on. Its headline SHALL present the page as the design
  system for English Course, the way the API reference's home presents itself as the API
  reference. It SHALL explain the four sidebar groups by their title prefix (`Cinema/`,
  `LessonView/`, `Components/`, `UI/`) and list what a reusable component needs before it ships:
  a colocated story, copy in every locale, a colocated test and JSDoc.
- `Docs/Color tokens`, showing the light and the dark palettes. The values SHALL be read from
  `src/app/globals.css` when Storybook builds, never copied by hand.
- `Docs/Typography`, showing Geist and Geist Mono as the app uses them.

#### Scenario: Storybook opens on the Welcome page

- **WHEN** someone opens Storybook's root URL
- **THEN** `Docs/Welcome` is selected and rendered
- **AND** its headline reads "The design system for English Course." with "design system" in gold
- **AND** it names the `Cinema/`, `LessonView/`, `Components/` and `UI/` groups

#### Scenario: The colour page shows the live token values

- **WHEN** a reviewer opens `Docs/Color tokens`
- **THEN** each swatch's value is the one declared for that token in `globals.css`, for both
  `:root` and `.dark`

#### Scenario: The theme switch moves a docs page

- **WHEN** a reviewer on a `Docs/` page switches the toolbar theme to light
- **THEN** the page re-renders in the cinema-light tokens, on the light backdrop, with its text
  readable against it
- **AND** switching back to dark returns it to cinema-dark

#### Scenario: The locale switch translates a docs page

- **WHEN** a reviewer on a `Docs/` page picks Español or Português in the toolbar
- **THEN** the page's headings and copy render in that language
- **AND** code, token names and file paths stay as written
