## MODIFIED Requirements

### Requirement: Shared Immersion Cinema primitives

The application SHALL provide reusable presentational primitives under `src/components/` that the four views compose: a cinema background (`CinemaBackground`) with a radial amber glow and letterbox bars; a brand wordmark (`Brand`); a section chrome/eyebrow; a `PosterCard`; a gold pill `GoldBadge`; and a circular `PlayButton`. Each interactive primitive SHALL be a real control with an accessible name and visible `focus-visible` styling, and SHALL respect `prefers-reduced-motion`.

The theme control SHALL be a binary toggle. Activating it SHALL move directly between the two themes — dark to light, light to dark — so the theme a learner wants is always one press away. It SHALL NOT cycle through a third state.

The theme control SHALL be presented as a switch: `role="switch"`, checked while the dark theme is active, with a thumb that slides between a light and a dark position and shows the icon of the theme it stands for. Its accessible name SHALL keep naming the current theme (`Theme: Dark`, `Theme: Light`). When activated, the switch SHALL move its thumb first and apply the new theme once the slide has played, because the theme provider suspends CSS transitions at the moment a theme is applied; under `prefers-reduced-motion: reduce` the thumb SHALL not animate and the theme SHALL apply at once.

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

#### Scenario: The switch slides before the theme changes
- **WHEN** the learner activates the theme switch while the app is dark
- **THEN** the switch reports unchecked and names the light theme immediately, and the light theme is applied once the slide has played

#### Scenario: Reduced motion applies the theme at once
- **WHEN** `prefers-reduced-motion: reduce` is set and the learner activates the theme switch
- **THEN** the new theme is applied immediately, without waiting for a slide

#### Scenario: A stored `system` preference migrates to dark
- **WHEN** a returning learner's storage still holds `system` from a previous build
- **THEN** the app renders dark and the toggle reports dark, so their next press moves to light

#### Scenario: The toggle never names a third theme
- **WHEN** the theme toggle renders in any locale, in either state
- **THEN** its visible text and its accessible name read either the dark or the light theme's name, and no "system" wording appears
