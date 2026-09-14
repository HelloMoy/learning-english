## MODIFIED Requirements

### Requirement: The Lesson Page is reachable by a locale-aware route

The application SHALL expose the Lesson Page at the route shape `/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`. The route SHALL be navigable from anywhere in the application via the existing locale-aware `<Link>` from `@/i18n/navigation`.

#### Scenario: A valid route renders the Lesson Page
- **WHEN** a user visits `/en/courses/basic-course/modules/1-introduction/lessons/0b06e639-efda-596d-8676-1e6e33410803` for a course, module, and lesson that exist
- **THEN** the page renders with the Outline (left), the native video Player (center), the Resources card and, below it, the closing block with the Mark as complete button and the next lesson (right rail)

#### Scenario: A locale segment that is not configured renders a not-found state
- **WHEN** a user visits `/xx/courses/.../lessons/...` for a locale `xx` that the project does not support
- **THEN** the existing locale-not-found behavior is preserved (no change to the locale routing)

### Requirement: The Lesson Page composes Outline, Player, Resources, Up next, and Mark as complete

The Lesson Page SHALL render the following regions, in this layout:

- **Breadcrumb** (top): `Course › Module › Lesson`
- **Aside (left)**: the **Outline** — a vertical list of Modules, each rendered as a heading with its Lessons listed below in `sequence` order. The current Lesson is visually indicated.
- **Main (center)**: the **Player** — an HTML5 `<video controls>` element with the Lesson video's `source` and `poster` (if present). Below the Player, the Lesson title and description.
- **Aside (right)**: a **Resources** card listing the Lesson `Resource` entries, followed by the closing block specified by the `lesson-close-card` capability, which carries the **Mark as complete** button and the **Up next** row pointing to the next Lesson, or the "Course completed" message if the current is the last Lesson of the last Module. The rail SHALL NOT render a separate **Up next** card at any viewport width: the next Lesson is offered exactly once, by the closing block, and the page SHALL NOT render a second **Mark as complete** button outside it.

On phone-class viewports — below the `lg` breakpoint — the three columns stack into one, the rail after the Main column; the regions above are otherwise unchanged.

A `Resource.url` addresses content — an absolute URL, or a site-relative path to a static asset served from `public/` — and never an in-app route. Resource links SHALL therefore be rendered with a plain anchor whose `href` is the `Resource.url` **verbatim**, and SHALL NOT be routed through the locale-aware `Link` from `@/i18n/navigation`. Applying the `localePrefix: "always"` locale segment to a `public/` asset path yields a path that does not exist and returns `404`.

The Lesson's notes `Resource` — the `readme.md` the Notes tab renders inline — SHALL NOT appear in the Resources card, and the right rail SHALL NOT offer any other card or row linking to it. The rendered notes are the learner's only route to that content.

The Up next link, by contrast, addresses an in-app Lesson route and SHALL remain locale-aware.

#### Scenario: The page renders all regions when the view is resolved
- **WHEN** the `findLessonForView` use case resolves to `{ ok: true, value: { course, module, lesson, resources, nextLesson } }`
- **THEN** the page renders the Outline, Player, Resources, Up next, and Mark as complete — none of the regions is empty or in a loading state

#### Scenario: The Resources card renders a flat list of resource items
- **WHEN** the resolved view contains three `Resource` entries (one PDF, one slides, one code)
- **THEN** the Resources card renders three rows, each with the title, a per-`ResourceKind` icon, and a link to the `url`

#### Scenario: A site-relative resource URL is not locale-prefixed
- **WHEN** a `Resource` has `url: "/local-filesystem-lesson/advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english/2-fast-i/fast-i-vowel-pronunciation-practice-see-sound.pdf"` and the active locale is `en`
- **THEN** the rendered link's `href` is that exact string — it does not begin with `/en/`, and no other locale segment is inserted

#### Scenario: An absolute resource URL is passed through untouched
- **WHEN** a `Resource` has an absolute `url` such as `https://example.com/handout.pdf`
- **THEN** the rendered link's `href` is that exact string

#### Scenario: A resource link opens in a new tab without leaking the opener
- **WHEN** any `Resource` row is rendered
- **THEN** the link carries `target="_blank"` and `rel="noopener noreferrer"`, so the learner does not navigate away from the lesson

#### Scenario: The notes resource is nowhere in the right rail
- **WHEN** a lesson whose `resources` include the notes `Resource` (the `readme.md` the Notes tab renders) is opened
- **THEN** no row anywhere in the right rail links to that `readme.md` — it is absent from the Resources card, and no separate notes card is rendered

#### Scenario: The Resources card shows its empty state when notes were its only resource
- **WHEN** a lesson's only `Resource` is the notes `readme.md`
- **THEN** the Resources card renders its localized empty-state message and no rows, rather than a second card appearing beside it

#### Scenario: The closing block points to the next lesson
- **WHEN** the resolved view has `nextLesson: SomeLesson`
- **THEN** the closing block's Up next row displays the next lesson's title as a locale-aware link to that Lesson's route, and it is the only link to that lesson on the page

#### Scenario: The closing block shows the terminal state when the course is complete
- **WHEN** the resolved view has `nextLesson: null`
- **THEN** the closing block displays the message "You've reached the end of the course" (translated via `next-intl`)

#### Scenario: The rail carries no Up next card at any width
- **WHEN** the Lesson Page is rendered at a 390px and at a 1440px viewport width
- **THEN** at neither width does the rail show an Up next card; the next lesson is offered by the closing block at the end of the rail, below the Resources card, and exactly one "Mark as complete" button is on the page

### Requirement: Components are colocated in `src/components/lesson-view/` and each has a Storybook story

Every component introduced by this capability (Outline, ModuleList, LessonList, NativeVideoPlayer, ResourceList, ResourceItem, LessonCloseCard, LessonCompletionToggle, LessonBreadcrumb, LessonView) SHALL live under `src/components/lesson-view/<component-name>/` with its implementation, its Vitest + RTL test, and its Storybook story. Each component SHALL be importable from a barrel `@/components/lesson-view`.

#### Scenario: Each component has at least one Storybook story
- **WHEN** a Storybook build runs
- **THEN** each component under `src/components/lesson-view/` is represented by at least one story in its `*.stories.tsx` file

#### Scenario: Each component has a passing unit test
- **WHEN** `pnpm test:run` runs
- **THEN** every test file under `src/components/lesson-view/` passes
