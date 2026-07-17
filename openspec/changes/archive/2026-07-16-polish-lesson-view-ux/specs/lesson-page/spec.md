# Delta Spec — lesson-page

This is a delta spec on top of the capability defined in
`openspec/specs/lesson-page/spec.md` (synced from the archived `add-lesson-view` change).
The polish change adjusts the error-state destination and codifies the dynamic
metadata behaviour. The full text of the prior spec is the baseline;
`## MODIFIED Requirements` show the updated form of an existing requirement
(full block), and `## ADDED Requirements` introduce the new behaviour.

## MODIFIED Requirements

### Requirement: The page handles domain errors with a user-facing error state

When `findLessonForView` returns an error (course not found, module not in course, lesson not in module), the page SHALL render a user-facing error state. The error state SHALL be localized (no raw `error.kind` string is shown to the user) and SHALL provide a way to navigate back to the locale's home (`/[locale]`) via a locale-aware link.

#### Scenario: An unknown course renders an error state with a home link
- **WHEN** the `courseSlug` does not match any seeded course
- **THEN** the page renders a localized "Course not found" message with a locale-aware "Go home" link pointing at `/[locale]`

#### Scenario: A module that does not belong to the course renders an error state with a home link
- **WHEN** the `moduleSlug` does not match any seeded module in the resolved course
- **THEN** the page renders a localized "Module not found in the course" message with a locale-aware "Go home" link pointing at `/[locale]`

#### Scenario: A lesson that does not belong to the module renders an error state with a home link
- **WHEN** the `lessonId` does not match any Lesson in the resolved Module
- **THEN** the page renders a localized "Lesson not found in the module" message with a locale-aware "Go home" link pointing at `/[locale]`

## ADDED Requirements

### Requirement: The "Go home" affordance on every error state points at the locale home

The `<LessonPageError>` component's recovery affordance SHALL route the learner to the locale's home (`/[locale]`), not to a non-existent courses list. This applies uniformly across all `kind` values (`module-not-in-course`, `lesson-not-in-module`, `invalid-params`) and across all locales.

#### Scenario: All error kinds route to the locale home
- **WHEN** any error state is rendered for any locale
- **THEN** the affordance's `href` is `/[locale]` (where `[locale]` is the route's locale), NOT `/[locale]/courses`

#### Scenario: Clicking the home affordance lands on a 200 page
- **WHEN** the user clicks the "Go home" affordance
- **THEN** the destination page returns HTTP 200 (no 404)