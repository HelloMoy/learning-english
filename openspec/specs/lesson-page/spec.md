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

The Player SHALL be a Vidstack `<MediaPlayer>` containing a `<MediaProvider>` and
Vidstack's Default Video Layout chrome. The player's `poster` SHALL be set when the
Lesson has a `poster`. The Default Layout SHALL provide, at minimum, play/pause, a
seekable time slider, elapsed and total time, volume, playback rate, and fullscreen.

The player's `src` SHALL be **derived** from the Lesson `source`, not passed through
verbatim, because a Lesson's video MAY be hosted by the project or by YouTube:

- When `source` is a YouTube link, the player SHALL load it through Vidstack's
  **YouTube provider**, whose `src` form is `youtube/<videoId>`. The recognized link
  forms are `youtube.com/embed/<id>`, `youtube.com/watch?v=<id>`, and `youtu.be/<id>`,
  with or without a `www.` or `m.` subdomain, on either `youtube.com` or
  `youtube-nocookie.com`, and with any additional query parameters present (`si`,
  `list`, `t`, …). Extra parameters SHALL be discarded — the provider owns the embed
  URL it builds.
- For every other `source`, the player SHALL load it as a direct video source, exactly
  as before.

Recognition SHALL be performed by a pure function that takes the `source` string and
returns the video id or nothing. It SHALL live outside `src/domain/**`: which provider
serves a URL is a delivery concern, and the domain models `source` as an opaque URL.

Every guarantee in this requirement SHALL hold identically for both kinds of source.
In particular, a YouTube-sourced Lesson SHALL present the same Default Layout chrome,
the same localized control names, the same app-themed treatment, the same 16:9 frame,
and the same overlay slot as a project-hosted one. The Player SHALL NOT branch into a
second player implementation for YouTube.

The **starting position** of a YouTube-sourced Lesson SHALL be applied by the seek
mechanism specified by the `playback-position` capability, and SHALL NOT be encoded as
a parameter of an embed URL. A URL parameter can only tell the video where to begin; it
cannot report where the learner stopped, and the position must remain writable.

Every string the Default Layout renders — control labels, tooltips, and menu entries —
SHALL be supplied through `next-intl` for every locale in `src/i18n/routing.ts`; the
library's built-in English defaults SHALL NOT be relied upon as the visible copy for
non-`en` locales.

The Player MAY render additional elements inside its own subtree, positioned over the
video frame, provided they do not obstruct the layout's controls while those controls
are visible. The in-player resume overlay specified by the `playback-position`
capability is such an element.

The Player SHALL keep the video frame at a 16:9 box that fills the width of the center
column, and SHALL present its full (non-compact) chrome at that size on desktop
viewports.

The Player's chrome SHALL follow the application's own resolved theme rather than the
operating system's color-scheme preference, so it never renders light chrome inside a
dark page.

#### Scenario: The Player renders with the lesson's source
- **WHEN** the resolved view's lesson has `source: "/videos/long-vs-short.mp4"`
- **THEN** the rendered player loads that source as a direct video source and presents
  Vidstack's Default Layout controls

#### Scenario: A YouTube embed link selects the YouTube provider
- **WHEN** the resolved view's lesson has
  `source: "https://www.youtube.com/embed/yY7RWGUbqng?si=nB8sjE4SQJoB0Itv"`
- **THEN** the player's `src` is `youtube/yY7RWGUbqng` — the `si` parameter is
  discarded and no MP4 source type is declared

#### Scenario: A YouTube watch link selects the YouTube provider
- **WHEN** the resolved view's lesson has
  `source: "https://www.youtube.com/watch?v=yY7RWGUbqng&list=PLabc"`
- **THEN** the player's `src` is `youtube/yY7RWGUbqng`

#### Scenario: A youtu.be short link selects the YouTube provider
- **WHEN** the resolved view's lesson has `source: "https://youtu.be/yY7RWGUbqng?t=42"`
- **THEN** the player's `src` is `youtube/yY7RWGUbqng`

#### Scenario: A non-YouTube URL that merely mentions YouTube is not treated as one
- **WHEN** the resolved view's lesson has
  `source: "https://cdn.example.com/youtube.com/watch?v=notreal.mp4"`
- **THEN** the player loads it as a direct video source — the host, not the path, is
  what selects the provider

#### Scenario: A YouTube lecture keeps the resume overlay and the position writes
- **WHEN** a learner presses play on a YouTube-sourced lesson that has a resumable
  stored position, resumes, and then pauses part-way through
- **THEN** the in-player resume overlay was offered exactly as it is for an MP4 lesson,
  the seek moved playback to the stored position, and the new position was written on
  `pause` — the lesson does not become read-only for playback position

#### Scenario: The Player shows the poster when present
- **WHEN** the resolved view's lesson has `poster: "/thumbnails/long-vs-short.jpg"`
- **THEN** the player paints that image over the video frame before playback begins,
  rather than an empty black frame

#### Scenario: A YouTube lecture without a `poster` still shows a thumbnail
- **WHEN** the resolved view's lesson is YouTube-sourced and has no `poster`
- **THEN** the idle frame shows the provider's own thumbnail rather than an empty black
  frame, and no `Poster` element is rendered from the lesson's absent `poster`

#### Scenario: The Player's chrome matches the app's theme
- **WHEN** the application's resolved theme is dark
- **THEN** the player's controls render in their dark treatment, regardless of the
  operating system's color-scheme preference

#### Scenario: The Player's controls are localized
- **WHEN** the Lesson Page renders under the `es` locale
- **THEN** the Default Layout's controls expose their accessible names in Spanish,
  sourced from `src/messages/es.json`, not from the library's English defaults

#### Scenario: A YouTube lecture's controls are the app's, localized the same way
- **WHEN** a YouTube-sourced lesson renders under the `es` locale
- **THEN** the visible chrome is Vidstack's Default Layout with Spanish control names
  from `src/messages/es.json` — not YouTube's own player chrome

#### Scenario: The Player has no custom Mark as complete affordance
- **WHEN** the Player is rendered
- **THEN** there is no Mark as complete button inside the Player chrome; the Mark as
  complete affordance lives in the page footer, next to the Player

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