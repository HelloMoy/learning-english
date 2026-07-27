# Capability: cinema-course-overview

## Purpose

Define the Immersion Cinema presentation of the course overview route (`/[locale]/courses/[courseSlug]`). The course is presented as a limited-series catalog: a poster grid where each module is an episode, with gold pills for module/lesson counts, a season heading, and a primary "Start course" action that targets the deterministic first lesson. The previous interactive practice track is removed from this view — module navigation is provided solely by the poster grid.

## Requirements

### Requirement: Course overview renders as an episode poster catalog

The course overview (`/[locale]/courses/[courseSlug]`) SHALL present the course as a limited-series catalog: an eyebrow ("Limited series"), the course title and description, gold pills for module and lesson counts, a season heading ("Season 1 · N episodes"), and a grid of `PosterCard`s — one per module — each showing the two-digit episode number, the module title, a play affordance, and a "Module"/episode-count badge. A "Start course" primary action SHALL link to the deterministic first lesson. The interactive practice track (`CourseOverviewTrack`) SHALL be removed from this view.

#### Scenario: One poster per module in sequence
- **WHEN** the course resolves 10 modules
- **THEN** the grid renders 10 `PosterCard`s numbered `01`–`10` in module order, each linking to its module overview for the active locale

#### Scenario: Start course targets the first lesson
- **WHEN** a first lesson exists
- **THEN** "Start course" links to that lesson via the locale-aware lesson path

#### Scenario: Practice track is gone
- **WHEN** the course overview renders
- **THEN** no `CourseOverviewTrack` is present and module navigation is provided solely by the poster grid

#### Scenario: Course copy is localized
- **WHEN** the locale is `es` or `pt`
- **THEN** the eyebrow, season heading, count pills, and "Start course" render from the matching message file