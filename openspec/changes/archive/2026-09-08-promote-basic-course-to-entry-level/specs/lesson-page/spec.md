## MODIFIED Requirements

### Requirement: The Lesson Page is reachable by a locale-aware route

The application SHALL expose the Lesson Page at the route shape `/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`. The route SHALL be navigable from anywhere in the application via the existing locale-aware `<Link>` from `@/i18n/navigation`.

#### Scenario: A valid route renders the Lesson Page
- **WHEN** a user visits `/en/courses/basic-course/modules/1-introduction/lessons/0b06e639-efda-596d-8676-1e6e33410803` for a course, module, and lesson that exist
- **THEN** the page renders with the Outline (left), the native video Player (center), the Resources and Up next cards (right), and the Mark as complete button (footer)

#### Scenario: A locale segment that is not configured renders a not-found state
- **WHEN** a user visits `/xx/courses/.../lessons/...` for a locale `xx` that the project does not support
- **THEN** the existing locale-not-found behavior is preserved (no change to the locale routing)
