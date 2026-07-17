# Capability: lesson-page

## Purpose

The `lesson-page` capability is the first user-facing product surface of the course platform. It defines the **Lesson Page** — the route that displays a single Lecture (a Lesson of `kind: "video"`) in the context of its Course and Module — and the components that compose it.

This spec captures WHAT the page must do, not HOW it is implemented. The components are described in terms of their observable behavior. The page is a driving adapter over the `course-platform-domain` capability; the domain contracts are defined in `openspec/specs/course-platform-domain/spec.md`.

The ubiquitous language is `GLOSSARY.md`. All new component names and UI labels MUST use the terms defined there.

## Requirements

### Requirement: The Lesson Page is reachable by a locale-aware route

The application SHALL expose the Lesson Page at the route shape `/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`. The route SHALL be navigable from anywhere in the application via the existing locale-aware `<Link>` from `@/i18n/navigation`.

#### Scenario: A valid route renders the Lesson Page
- **WHEN** a user visits `/en/courses/english-a1-pronunciation/modules/vowels-and-video-intro/lessons/22222222-2222-4222-8222-222222222220` for a course, module, and lesson that exist
- **THEN** the page renders with the Outline (left), the native video Player (center), the Resources and Up next cards (right), and the Mark as complete button (footer)

#### Scenario: A locale segment that is not configured renders a not-found state
- **WHEN** a user visits `/xx/courses/.../lessons/...` for a locale `xx` that the project does not support
- **THEN** the existing locale-not-found behavior is preserved (no change to the locale routing)

### Requirement: The Lesson Page composes Outline, Player, Resources, Up next, and Mark as complete

The Lesson Page SHALL render the following regions, in this layout:

- **Breadcrumb** (top): `Course › Module › Lesson`
- **Aside (left)**: the **Outline** — a vertical list of Modules, each rendered as a heading with its Lessons listed below in `sequence` order. The current Lesson is visually indicated.
- **Main (center)**: the **Player** — an HTML5 `<video controls>` element with the Lesson video's `source` and `poster` (if present). Below the Player, the Lesson title, description, and a **Mark as complete** button.
- **Aside (right)**: a **Resources** card listing the Lesson `Resource` entries, and an **Up next** card pointing to the next Lesson or showing "Course completed" if the current is the last Lesson of the last Module.

#### Scenario: The page renders all regions when the view is resolved
- **WHEN** the `findLessonForView` use case resolves to `{ ok: true, value: { course, module, lesson, resources, nextLesson } }`
- **THEN** the page renders the Outline, Player, Resources, Up next, and Mark as complete — none of the regions is empty or in a loading state

#### Scenario: The Resources card renders a flat list of resource items
- **WHEN** the resolved view contains three `Resource` entries (one PDF, one slides, one code)
- **THEN** the Resources card renders three rows, each with the title, a per-`ResourceKind` icon, and a link to the `url`

#### Scenario: The Up next card points to the next lesson
- **WHEN** the resolved view has `nextLesson: SomeLesson`
- **THEN** the Up next card displays the next lesson's title as a locale-aware link to that Lesson's route

#### Scenario: The Up next card shows the terminal state when the course is complete
- **WHEN** the resolved view has `nextLesson: null`
- **THEN** the Up next card displays the message "You've reached the end of the course" (translated via `next-intl`)

### Requirement: The Outline shows the course's modules and lessons with the current lesson indicated

The Outline SHALL render Modules in `sequence` order. Each Module SHALL list its Lessons in `sequence` order. The current Lesson SHALL be visually indicated (e.g., highlighted, bold, or marked with an icon — implementation choice).

#### Scenario: The Outline lists modules in sequence order
- **WHEN** the resolved view's course has three modules at sequences 1, 2, 3
- **THEN** the Outline renders the modules in ascending `sequence` order

#### Scenario: The current lesson is visually distinct
- **WHEN** the user is on Lesson 2 of Module 1
- **THEN** Lesson 2 of Module 1 is rendered with the "current" indicator; the other lessons are not

#### Scenario: Each lesson row links to that lesson's route
- **WHEN** the Outline renders a lesson row
- **THEN** the row is a locale-aware link to `/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`

### Requirement: The Player is the native HTML5 `<video controls>` element

The Player SHALL be a single HTML5 `<video controls>` element. The `src` attribute SHALL be the Lesson `source` URL. The `poster` attribute SHALL be set when the Lesson has a `poster`. No custom chrome, no custom JavaScript wrapper, no overlay.

#### Scenario: The Player renders with the lesson's source
- **WHEN** the resolved view's lesson has `source: "/videos/long-vs-short.mp4"`
- **THEN** the rendered `<video>` element has `src="/videos/long-vs-short.mp4"` and the browser's native controls

#### Scenario: The Player shows the poster when present
- **WHEN** the resolved view's lesson has `poster: "/thumbnails/long-vs-short.jpg"`
- **THEN** the rendered `<video>` element has the `poster` attribute set to that URL

#### Scenario: The Player has no custom Mark as complete affordance
- **WHEN** the Player is rendered
- **THEN** there is no Mark as complete button inside the Player chrome; the Mark as complete affordance lives in the page footer, next to the Player

### Requirement: The Mark as complete button is a manual, ephemeral action

The Lesson Page SHALL render a **Mark as complete** button below the Player. Clicking the button SHALL call the `markLessonComplete` use case via a Next.js Server Action. The button SHALL toggle its label between "Mark as complete" and "Marked complete" (translated via `next-intl`). The completed state is **ephemeral** — refreshing the page or restarting the server resets the button to "Mark as complete". This is the v1 limitation; persistence arrives with a follow-up change.

#### Scenario: The button starts in the "Mark as complete" state
- **WHEN** the page loads
- **THEN** the button label is "Mark as complete"

#### Scenario: Clicking the button changes the label
- **WHEN** the user clicks the button
- **THEN** the button label becomes "Marked complete"

#### Scenario: The completed state is lost on reload
- **WHEN** the user clicks the button, then refreshes the page
- **THEN** the button label is "Mark as complete" again (in-memory state was lost)

### Requirement: The breadcrumb shows Course › Module › Lesson

The Lesson Page SHALL render a breadcrumb at the top with three segments: the Course title (linking to the course root, deferred — for v1 the link is the course slug), the Module title (linking to the module's first lesson, or just a label — implementation choice), and the current Lesson title (not a link).

#### Scenario: The breadcrumb renders three segments
- **WHEN** the page loads
- **THEN** the breadcrumb displays "Course › Module › Lesson" with each segment labeled using the entity's `title`

#### Scenario: The breadcrumb is locale-aware
- **WHEN** the user is in the `es` locale
- **THEN** the breadcrumb's link segments use the locale-aware `<Link>` (so the URL stays under `/es/...`)

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

### Requirement: Components are colocated in `src/components/lesson-view/` and each has a Storybook story

Every component introduced by this capability (Outline, ModuleList, LessonList, NativeVideoPlayer, ResourceList, ResourceItem, UpNextCard, MarkAsCompleteButton, LessonBreadcrumb, LessonView) SHALL live under `src/components/lesson-view/<component-name>/` with its implementation, its Vitest + RTL test, and its Storybook story. Each component SHALL be importable from a barrel `@/components/lesson-view`.

#### Scenario: Each component has at least one Storybook story
- **WHEN** a Storybook build runs
- **THEN** each component under `src/components/lesson-view/` is represented by at least one story in its `*.stories.tsx` file

#### Scenario: Each component has a passing unit test
- **WHEN** `pnpm test:run` runs
- **THEN** every test file under `src/components/lesson-view/` passes

### Requirement: The "Go home" affordance on every error state points at the locale home

The `<LessonPageError>` component's recovery affordance SHALL route the learner to the locale's home (`/[locale]`), not to a non-existent courses list. This applies uniformly across all `kind` values (`module-not-in-course`, `lesson-not-in-module`, `invalid-params`) and across all locales.

#### Scenario: All error kinds route to the locale home
- **WHEN** any error state is rendered for any locale
- **THEN** the affordance's `href` is `/[locale]` (where `[locale]` is the route's locale), NOT `/[locale]/courses`

#### Scenario: Clicking the home affordance lands on a 200 page
- **WHEN** the user clicks the "Go home" affordance
- **THEN** the destination page returns HTTP 200 (no 404)