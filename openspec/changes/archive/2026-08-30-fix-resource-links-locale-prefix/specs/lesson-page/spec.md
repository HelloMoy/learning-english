## MODIFIED Requirements

### Requirement: The Lesson Page composes Outline, Player, Resources, Up next, and Mark as complete

The Lesson Page SHALL render the following regions, in this layout:

- **Breadcrumb** (top): `Course › Module › Lesson`
- **Aside (left)**: the **Outline** — a vertical list of Modules, each rendered as a heading with its Lessons listed below in `sequence` order. The current Lesson is visually indicated.
- **Main (center)**: the **Player** — an HTML5 `<video controls>` element with the Lesson video's `source` and `poster` (if present). Below the Player, the Lesson title, description, and a **Mark as complete** button.
- **Aside (right)**: a **Resources** card listing the Lesson `Resource` entries, and an **Up next** card pointing to the next Lesson or showing "Course completed" if the current is the last Lesson of the last Module.

A `Resource.url` addresses content — an absolute URL, or a site-relative path to a static asset served from `public/` — and never an in-app route. Resource links SHALL therefore be rendered with a plain anchor whose `href` is the `Resource.url` **verbatim**, and SHALL NOT be routed through the locale-aware `Link` from `@/i18n/navigation`. Applying the `localePrefix: "always"` locale segment to a `public/` asset path yields a path that does not exist and returns `404`.

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

#### Scenario: The Lesson notes (source) card follows the same linking rule
- **WHEN** the right rail renders the "Lesson notes (source)" card for a lesson whose notes `Resource` has a site-relative `readme.md` URL
- **THEN** that link's `href` is the `Resource.url` verbatim, with no locale prefix — the notes card and the Resources card share one linking behavior

#### Scenario: The Up next card points to the next lesson
- **WHEN** the resolved view has `nextLesson: SomeLesson`
- **THEN** the Up next card displays the next lesson's title as a locale-aware link to that Lesson's route

#### Scenario: The Up next card shows the terminal state when the course is complete
- **WHEN** the resolved view has `nextLesson: null`
- **THEN** the Up next card displays the message "You've reached the end of the course" (translated via `next-intl`)
