# Capability: cinema-home

## Purpose

Define the Immersion Cinema presentation of the locale layout and home route. The locale layout renders a global header that exposes the brand and a route-derived section eyebrow while preserving the existing locale switcher and theme toggle. The home route (`/[locale]`) renders as a streaming cover: a cinema hero with localized copy and CTAs, followed by a featured-course rail that surfaces the real catalog course with module/lesson counts and a compact module index.

## Requirements

### Requirement: Global header shows brand and section chrome

The locale layout SHALL render an Immersion Cinema header containing the `LEARN·ENGLISH` wordmark, a section eyebrow of the form `IMMERSION CINEMA · <SECTION>` where `<SECTION>` derives from the current route (`HOME`, `COURSE`, `MODULE`, `LESSON`), and the existing locale switcher and theme toggle re-styled as chips. The header SHALL remain a landmark, keep locale switching and theme toggling functional, and be localized.

#### Scenario: Section label reflects the route
- **WHEN** the user is on the locale home
- **THEN** the header eyebrow reads `IMMERSION CINEMA · HOME`; on a lesson route it reads `IMMERSION CINEMA · LESSON`

#### Scenario: Locale and theme controls remain functional
- **WHEN** the header renders with the chip-styled controls
- **THEN** changing the locale and toggling the theme behave exactly as before the re-skin

### Requirement: Home renders as a streaming cover with a featured course

The locale home (`/[locale]`) SHALL present a cinema hero over a `CinemaBackground` with an eyebrow ("Now streaming · Spoken English"), the localized title and subtitle, and primary/secondary calls to action ("Open course", "+ My List"). It SHALL render a featured-course rail for the real course, showing a "Welcome" poster, the localized course title and description, a gold pill with module/lesson counts, and a compact `01–10` module index. All copy SHALL be localized (en/es/pt) and links SHALL be locale-aware.

#### Scenario: Hero and featured course use real data
- **WHEN** the catalog resolves the `advanced-intermediate-course`
- **THEN** the featured rail shows its real title, description, and counts (e.g. "10 modules · 107 lessons"), and "Open course" links to the course overview for the active locale

#### Scenario: Empty catalog degrades gracefully
- **WHEN** the catalog returns no entries
- **THEN** the home shows a localized empty state instead of a broken featured rail

#### Scenario: Home copy is localized
- **WHEN** the locale is `es`
- **THEN** the eyebrow, CTAs, and counts render from `es.json`, not hardcoded English