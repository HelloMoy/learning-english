## MODIFIED Requirements

### Requirement: The Lesson Page composes Outline, Player, Resources, Up next, Notes, and Mark as complete

The Lesson Page SHALL render the following regions, in this layout:

- **Breadcrumb** (top): `Course › Module › Lesson`.
- **Aside (left)**: the **Outline** — a vertical list of Modules, each rendered as a heading with its Lessons listed below in `sequence` order. The current Lesson is visually indicated; inactive module lesson groups MAY be collapsed by default.
- **Main (center)**: the **Player** — an HTML5 `<video controls>` element with the Lesson video's `source` and `poster` (if present). Below the Player, the Lesson title, description, optional inline Markdown Notes and a **Mark as complete** button.
- **Aside (right)**: a **Resources** card listing the Lesson `Resource` entries, including the original Markdown notes link when notes are rendered, and an **Up next** card pointing to the next Lesson or showing "Course completed" if the current is the last Lesson of the last Module.

#### Scenario: The page renders all regions when the view is resolved
- **WHEN** the `findLessonForView` use case resolves to `{ ok: true, value: { course, module, lesson, resources, nextLesson } }`
- **THEN** the page renders the Outline, Player or reading body, Resources, Up next, optional Notes and Mark as complete — none of the required regions is empty or in a loading state

#### Scenario: A video lesson with notes renders Notes in the main column
- **WHEN** `findLessonNotes` resolves Markdown for the current lesson
- **THEN** the main column renders a localized Notes heading and the safe Markdown output below the video description

#### Scenario: A video lesson without notes remains valid
- **WHEN** `findLessonNotes` resolves `null`
- **THEN** the page renders the video, title, description, Resources and Up next without an empty Notes heading

#### Scenario: The Resources card renders a flat list of resource items
- **WHEN** the resolved view contains three `Resource` entries (one PDF, one slides, one code)
- **THEN** the Resources card renders three rows, each with the title, a per-`ResourceKind` icon, and a link to the `url`

#### Scenario: The Up next card points to the next lesson
- **WHEN** the resolved view has `nextLesson: SomeLesson`
- **THEN** the Up next card displays the next lesson's title as a locale-aware link to that Lesson's route

#### Scenario: The Up next card shows the terminal state when the course is complete
- **WHEN** the resolved view has `nextLesson: null`
- **THEN** the Up next card displays the message "You've reached the end of the course" (translated via `next-intl`)

### Requirement: The breadcrumb shows working Course › Module › Lesson links

The Lesson Page SHALL render a breadcrumb at the top with three segments: the Course title linking to `/[locale]/courses/[courseSlug]`, the Module title linking to `/[locale]/courses/[courseSlug]/modules/[moduleSlug]`, and the current Lesson title (not a link). The first two segments SHALL use the locale-aware `<Link>` from `@/i18n/navigation`; the current segment SHALL carry `aria-current="page"`.

#### Scenario: The breadcrumb renders three segments
- **WHEN** the page loads
- **THEN** the breadcrumb displays "Course › Module › Lesson" with each segment labeled using the entity's `title`

#### Scenario: The course breadcrumb reaches the course overview
- **WHEN** a user activates the Course segment
- **THEN** they reach `/[locale]/courses/[courseSlug]` with HTTP 200 for a known course

#### Scenario: The module breadcrumb reaches the module overview
- **WHEN** a user activates the Module segment
- **THEN** they reach `/[locale]/courses/[courseSlug]/modules/[moduleSlug]` with HTTP 200 for a known module

#### Scenario: The breadcrumb is locale-aware
- **WHEN** the user is in the `es` locale
- **THEN** the breadcrumb's link segments use the locale-aware `<Link>` so the URL stays under `/es/...`
