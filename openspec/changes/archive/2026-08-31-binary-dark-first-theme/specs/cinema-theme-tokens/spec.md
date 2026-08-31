## MODIFIED Requirements

### Requirement: Immersion Cinema token layer with two accessible variants

The application SHALL define its color tokens as an "Immersion Cinema" palette in `src/app/globals.css`, exposing a warm light variant on `:root` and a warm dark variant on `.dark`, both derived from the gold/amber hue family. The dark variant SHALL use the mockup values (`bg #08080b`, `ink #f4f1ea`, `gold #e7b64c`, `amber #f0c869`). Existing semantic utilities (`bg-background`, `text-foreground`, `text-ink`, `bg-card`, `text-muted-foreground`, `bg-signal-yellow`) SHALL resolve to cinema colors without requiring per-component className changes.

All color pairs used for text SHALL meet WCAG 2.1 AA (≥ 4.5:1 for body text, ≥ 3:1 for large text and non-text UI). Gold accents used as text on light backgrounds SHALL use a darkened bronze token rather than `#e7b64c`.

The dark variant SHALL be the default. A visitor with no stored preference SHALL be served the dark palette, and the application SHALL NOT read the operating system's `prefers-color-scheme` to choose between the variants — Immersion Cinema is a dark design, and the light variant is the alternate a learner opts into rather than one an OS setting selects for them.

The application SHALL recognise exactly two themes, `dark` and `light`. `system` SHALL NOT be a state the application can hold, and SHALL NOT appear in any user-facing copy.

#### Scenario: Dark variant matches the cinema mockup
- **WHEN** the app renders under the `.dark` theme
- **THEN** the background resolves to near-black `#08080b`, primary text to cream `#f4f1ea`, and the accent to gold `#e7b64c`/amber `#f0c869`

#### Scenario: Light variant stays contrast-safe
- **WHEN** the app renders under the light (`:root`) theme
- **THEN** body text and accent-on-surface pairs meet WCAG AA, using a bronze accent for text rather than the bright amber

#### Scenario: Existing utilities inherit the new palette
- **WHEN** a component already using `bg-card`/`text-muted-foreground`/`bg-signal-yellow` is rendered
- **THEN** it displays cinema colors with no change to its className list

#### Scenario: A first-time visitor lands in dark
- **WHEN** someone opens the app with no theme stored
- **THEN** the dark variant renders, whatever their operating system prefers

#### Scenario: The OS preference does not override a stored choice
- **WHEN** a learner has chosen light and their operating system prefers dark
- **THEN** the app renders light, because the stored choice is the only input

### Requirement: Shared Immersion Cinema primitives

The application SHALL provide reusable presentational primitives under `src/components/` that the four views compose: a cinema background (`CinemaBackground`) with a radial amber glow and letterbox bars; a brand wordmark (`Brand`); a section chrome/eyebrow; a `PosterCard`; a gold pill `GoldBadge`; and a circular `PlayButton`. Each interactive primitive SHALL be a real control with an accessible name and visible `focus-visible` styling, and SHALL respect `prefers-reduced-motion`.

The theme control SHALL be a binary toggle. Activating it SHALL move directly between the two themes — dark to light, light to dark — so the theme a learner wants is always one press away. It SHALL NOT cycle through a third state.

Because an earlier build persisted `system` as a theme, the control SHALL treat any stored value that is not one of the two recognised themes as dark, the default. A returning learner SHALL never find the toggle in a state it cannot name or move out of.

#### Scenario: PosterCard renders artwork or a glow fallback
- **WHEN** a `PosterCard` is given a poster image URL
- **THEN** it renders an `<img>` with an accessible `alt`, layered under the glow and number; **AND WHEN** no URL is provided, it renders the glow-only fallback without a broken image

#### Scenario: Play affordance is an accessible control
- **WHEN** a `PlayButton` (or a PosterCard play affordance) is rendered
- **THEN** it is a focusable control with an accessible name and a visible focus ring, not a decorative element

#### Scenario: Motion respects user preference
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** glow/transition animations on cinema primitives are disabled

#### Scenario: One press swaps the theme
- **WHEN** the learner activates the theme toggle while the app is dark
- **THEN** the app switches to light; **AND WHEN** they activate it again
- **THEN** the app returns to dark, having passed through no other state

#### Scenario: A stored `system` preference migrates to dark
- **WHEN** a returning learner's storage still holds `system` from a previous build
- **THEN** the app renders dark and the toggle reports dark, so their next press moves to light

#### Scenario: The toggle never names a third theme
- **WHEN** the theme toggle renders in any locale, in either state
- **THEN** its visible text and its accessible name read either the dark or the light theme's name, and no "system" wording appears
