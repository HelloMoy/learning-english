# Capability: cinema-theme-tokens

## Purpose

Define the "Immersion Cinema" design tokens and the shared presentational primitives that the four locale views (home, course overview, module overview, lesson view) compose. The token layer wires the application's color palette as CSS custom properties in `src/app/globals.css`, exposing a warm light variant on `:root` and a warm dark variant on `.dark`, both derived from the gold/amber hue family. The primitives layer provides reusable, accessible building blocks (`CinemaBackground`, `Brand`, section eyebrow, `PosterCard`, `GoldBadge`, `PlayButton`) so the views compose a coherent cinematic experience without re-implementing its visual language.

## Requirements

### Requirement: Immersion Cinema token layer with two accessible variants

The application SHALL define its color tokens as an "Immersion Cinema" palette in `src/app/globals.css`, exposing a warm light variant on `:root` and a warm dark variant on `.dark`, both derived from the gold/amber hue family. The dark variant SHALL use the mockup values (`bg #08080b`, `ink #f4f1ea`, `gold #e7b64c`, `amber #f0c869`). Existing semantic utilities (`bg-background`, `text-foreground`, `text-ink`, `bg-card`, `text-muted-foreground`, `bg-signal-yellow`) SHALL resolve to cinema colors without requiring per-component className changes.

All color pairs used for text SHALL meet WCAG 2.1 AA (≥ 4.5:1 for body text, ≥ 3:1 for large text and non-text UI). Gold accents used as text on light backgrounds SHALL use a darkened bronze token rather than `#e7b64c`.

#### Scenario: Dark variant matches the cinema mockup
- **WHEN** the app renders under the `.dark` theme
- **THEN** the background resolves to near-black `#08080b`, primary text to cream `#f4f1ea`, and the accent to gold `#e7b64c`/amber `#f0c869`

#### Scenario: Light variant stays contrast-safe
- **WHEN** the app renders under the light (`:root`) theme
- **THEN** body text and accent-on-surface pairs meet WCAG AA, using a bronze accent for text rather than the bright amber

#### Scenario: Existing utilities inherit the new palette
- **WHEN** a component already using `bg-card`/`text-muted-foreground`/`bg-signal-yellow` is rendered
- **THEN** it displays cinema colors with no change to its className list

### Requirement: Shared Immersion Cinema primitives

The application SHALL provide reusable presentational primitives under `src/components/` that the four views compose: a cinema background (`CinemaBackground`) with a radial amber glow and letterbox bars; a brand wordmark (`Brand`); a section chrome/eyebrow; a `PosterCard`; a gold pill `GoldBadge`; and a circular `PlayButton`. Each interactive primitive SHALL be a real control with an accessible name and visible `focus-visible` styling, and SHALL respect `prefers-reduced-motion`.

#### Scenario: PosterCard renders artwork or a glow fallback
- **WHEN** a `PosterCard` is given a poster image URL
- **THEN** it renders an `<img>` with an accessible `alt`, layered under the glow and number; **AND WHEN** no URL is provided, it renders the glow-only fallback without a broken image

#### Scenario: Play affordance is an accessible control
- **WHEN** a `PlayButton` (or a PosterCard play affordance) is rendered
- **THEN** it is a focusable control with an accessible name and a visible focus ring, not a decorative element

#### Scenario: Motion respects user preference
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** glow/transition animations on cinema primitives are disabled