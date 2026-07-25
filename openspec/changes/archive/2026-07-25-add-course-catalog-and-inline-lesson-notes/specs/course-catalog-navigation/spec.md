## ADDED Requirements

### Requirement: The locale home exposes the available course as a navigable card

The application SHALL render a course card on `/[locale]` for every course returned by the course catalog use case. Each card SHALL expose the course title, module count, lesson count and a locale-aware link to `/[locale]/courses/[courseSlug]`. The card SHALL use the existing course poster when the catalog provides one and SHALL render an accessible non-image fallback when it does not.

#### Scenario: The Advanced Intermediate Course appears on the English home
- **WHEN** `USE_COURSE_CONTENT_SEED=1` and a user visits `/en`
- **THEN** the page renders a card named `Advanced Intermediate Course` with `10 modules` and `107 lessons`, and a link to `/en/courses/advanced-intermediate-course`

#### Scenario: The card preserves the locale prefix
- **WHEN** a user visits `/es` or `/pt`
- **THEN** the course card's destination begins with `/es/courses/` or `/pt/courses/` respectively

#### Scenario: An empty catalog has a directed empty state
- **WHEN** the catalog use case returns an empty list
- **THEN** the home renders a useful localized empty state instead of an empty grid or broken card

### Requirement: The course overview exposes the module sequence and entry lesson

The application SHALL expose `/[locale]/courses/[courseSlug]` and SHALL render the resolved course title, description, module and lesson totals, an ordered list of modules, and a locale-aware CTA to the first lesson. Each module entry SHALL link to `/[locale]/courses/[courseSlug]/modules/[moduleSlug]` and SHALL show its lesson count.

#### Scenario: A valid course overview renders all ten modules
- **WHEN** a user visits `/en/courses/advanced-intermediate-course`
- **THEN** the page renders the course overview with the ten modules in ascending `sequence` order and a link to the first lesson `Welcome`

#### Scenario: The first-lesson CTA uses deterministic ordering
- **WHEN** the course contains multiple modules and lessons
- **THEN** the CTA targets the lesson with the lowest module sequence and lowest lesson sequence, not an arbitrary repository entry

#### Scenario: An unknown course is not presented as an empty course
- **WHEN** `courseSlug` does not resolve
- **THEN** the route renders the established localized not-found/error recovery surface and does not render module links

### Requirement: The module overview exposes only that module's lessons

The application SHALL expose `/[locale]/courses/[courseSlug]/modules/[moduleSlug]` and SHALL render the course breadcrumb, module title, lesson count and an ordered list containing only lessons belonging to that module. Every lesson row SHALL be a locale-aware link to the existing Lesson Page route and SHALL expose the lesson duration when it is available.

#### Scenario: A module overview renders its lessons in sequence order
- **WHEN** a user visits `/en/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course`
- **THEN** the page renders exactly the four lessons belonging to that module in sequence order

#### Scenario: A lesson row links to the existing Lesson Page
- **WHEN** a module overview renders `Welcome`
- **THEN** its link targets `/en/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course/lessons/9e9d39a2-d2bb-57bb-9a5e-37de8c3e2a1c`

#### Scenario: A module from another course is rejected
- **WHEN** `moduleSlug` does not belong to `courseSlug`
- **THEN** the page renders a localized module-not-found state with a working course/home recovery link

### Requirement: Course navigation uses the practice-track structure without hiding semantic links

The course overview SHALL provide an ordered ten-step practice-track navigation whose steps correspond to the actual module sequence. Decorative marks SHALL have an accessible textual equivalent, and each interactive step SHALL be a semantic locale-aware link with a visible focus state.

#### Scenario: The practice track matches the module count
- **WHEN** a course has ten modules
- **THEN** the track exposes ten ordered module steps and does not invent progress values

#### Scenario: The track remains usable without images or motion
- **WHEN** images fail to load or the user prefers reduced motion
- **THEN** module titles and links remain readable and operable without relying on animation or color alone

### Requirement: Course and module pages provide localized metadata and semantic navigation

Course and module pages SHALL generate titles from resolved route data and localized UI messages. All navigation SHALL use `Link` from `@/i18n/navigation`, and the pages SHALL expose one `main` landmark with a skip-link target.

#### Scenario: Course metadata uses the resolved course title
- **WHEN** a valid course route is requested
- **THEN** the document title contains the resolved course title and not the raw slug

#### Scenario: Module metadata uses the resolved module title
- **WHEN** a valid module route is requested
- **THEN** the document title contains the resolved module title and the locale prefix remains intact
