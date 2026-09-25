## ADDED Requirements

### Requirement: The API reference renders in the Immersion Cinema dark theme

`pnpm run docs` SHALL generate the reference with a TypeDoc theme named `cinema`
that paints every page in the Immersion Cinema dark palette: background
`#08080b`, text `#f4f1ea`, accent gold `#e7b64c` and amber `#f0c869`, with the
cinema radial glow behind the content. The palette SHALL NOT depend on the
reader's operating-system preference or on a theme stored by TypeDoc, and
TypeDoc's theme selector SHALL NOT be shown. Highlighted code SHALL use a dark
palette in every state.

#### Scenario: A reader whose OS prefers light
- **WHEN** the reference is opened in a browser that prefers a light colour scheme
- **THEN** the page background is `#08080b` and body text is `#f4f1ea`

#### Scenario: A reader who stored TypeDoc's light theme earlier
- **WHEN** `localStorage` holds `tsd-theme = "light"` and a page is opened
- **THEN** the page still renders in the dark palette, and code blocks use the dark highlight colours

#### Scenario: No theme selector
- **WHEN** the reader opens the Settings panel
- **THEN** it offers member-visibility filters but no Light/Dark/OS choice

### Requirement: Branded toolbar and footer

Every page SHALL show a toolbar whose title link reads `ENGLISH·COURSE` with
the middle dot in gold, followed by an `API` tag, and links to the reference
home. The toolbar SHALL keep TypeDoc's search trigger, search dialog and menu
trigger working. Every page SHALL end with a footer showing the wordmark and
the command that regenerates the reference (`pnpm run docs`).

#### Scenario: Wordmark on a declaration page
- **WHEN** any declaration page is rendered
- **THEN** its toolbar title link contains `ENGLISH`, a gold `·`, `COURSE` and an `API` tag, and points at `index.html`

#### Scenario: Search still opens
- **WHEN** the reader activates the search trigger or presses `/`
- **THEN** TypeDoc's search dialog opens and returns results

### Requirement: Home page starts from the hexagon

The reference's `index.html` SHALL be a home page generated from the project
model, containing, in order:

1. A marquee with a gold eyebrow naming the project, a headline, a one-line
   lede, and badges for the package version and the number of documented
   modules.
2. One poster per hexagonal layer — use cases (`domain/use-cases`), ports
   (`domain/ports`), entities (`domain/entities`), adapters (`adapters`),
   hooks (`hooks`) and components (`components`) — each showing its folder
   path, the number of documented modules under that folder, a title and a
   one-line description, and linking to that folder's group in the index.
3. An index of every documented module, grouped by folder (the first path
   segment, or the first two under `domain/`). Groups for the six layers come
   first in the order above; the remaining groups follow alphabetically. Each
   row SHALL link to the module page and show the module path with a repeated
   final segment collapsed, the short summary of its most representative
   documented export when one exists, and the distinct kinds of symbol it
   exports. The representative export is the first documented function or
   class, then the first documented variable or enum, and only then the first
   other documented export (type alias, interface, …), so a module is
   summarised by what it does rather than by a helper type it declares first.

The counts SHALL be computed at generation time, never written by hand.

#### Scenario: Layer counts follow the code
- **WHEN** the project documents 13 modules under `domain/use-cases/`
- **THEN** the use-cases poster shows `13`, and adding a documented use case changes it to `14` on the next `pnpm run docs`

#### Scenario: A poster jumps to its group
- **WHEN** the reader activates the hooks poster
- **THEN** the page scrolls to the `hooks` group of the module index

#### Scenario: Repeated leaf collapsed
- **WHEN** the module `lib/format-duration/format-duration` is listed
- **THEN** its row reads `lib/format-duration` and links to that module's page

#### Scenario: Row summary and kinds
- **WHEN** a module exports a documented function and a type alias
- **THEN** its row shows the function's short summary and the kinds `Function` and `Type Alias`

#### Scenario: A helper type declared first does not summarise the module
- **WHEN** a hook module declares a documented props type before its documented hook function
- **THEN** its row shows the hook's short summary, not the props type's

#### Scenario: A module of types is summarised by a type
- **WHEN** a port module exports only a documented interface
- **THEN** its row shows the interface's short summary

#### Scenario: Group order
- **WHEN** the index is rendered
- **THEN** the `domain/use-cases`, `domain/ports`, `domain/entities`, `adapters`, `hooks` and `components` groups appear before every other group, in that order

### Requirement: Declaration pages carry cinema chrome

Every non-home declaration page SHALL render the breadcrumb, then the
declaration's kind as a gold uppercase eyebrow, then the declaration's name in
the monospace face as the page's single `h1`. This covers modules, functions,
type aliases, interfaces, classes and variables. Signatures SHALL sit in a
gold-framed panel, section headings (Parameters, Returns, Remarks, Example,
…) SHALL use the gold eyebrow treatment, and code examples SHALL render in a
framed block that keeps TypeDoc's copy button.

#### Scenario: Function page title
- **WHEN** the page for `formatDuration` is rendered
- **THEN** it shows the eyebrow `Function` and an `h1` reading `formatDuration`, with no `Function` text inside the `h1`

#### Scenario: Example keeps its copy button
- **WHEN** a declaration has an `@example` block
- **THEN** the code renders highlighted in the dark palette and its Copy button copies the code

### Requirement: The reference stays usable at phone width

At a viewport 400px wide, pages SHALL keep at least a 16px side gutter, SHALL
NOT scroll horizontally except inside code blocks and signatures, and the home
page's posters SHALL stack into a single column.

#### Scenario: Home page on a phone
- **WHEN** `index.html` is opened at 400px wide
- **THEN** the posters form one column and the document does not scroll sideways

### Requirement: The reference identifies itself and never serves stale styling

Every page SHALL declare the app's icon (`src/app/icon.svg`) as its favicon.
Every generated page SHALL reference its stylesheets and scripts with a
cache-busting query that changes on each generation, so a browser that cached
an earlier build loads the new styling on a normal reload.

#### Scenario: Favicon
- **WHEN** any page of the reference is opened
- **THEN** the browser tab shows the English Course icon and no favicon request fails

#### Scenario: Regenerated styling reaches a returning reader
- **WHEN** the reference is regenerated after a stylesheet change and a reader who viewed the previous build reloads a page normally
- **THEN** the page loads the new stylesheet

