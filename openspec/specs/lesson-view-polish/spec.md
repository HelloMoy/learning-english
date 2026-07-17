# Capability: lesson-view-polish

## Purpose

The `lesson-view-polish` capability captures a set of cross-cutting UX fixes for the Lesson Page discovered during the first Playwright walkthrough of the archived `add-lesson-view` change. It captures the **what** (the observable behavior of the polished surfaces), decoupled from any specific implementation detail.

Related capabilities carry their own deltas: dynamic metadata and error-state recovery lives in `lesson-page`; the `next-themes` runtime acknowledgement lives in `architecture-boundaries`.

The ubiquitous language is `GLOSSARY.md`.

## Requirements

### Requirement: The Lesson Page sets a per-page `<title>`

The application SHALL set the document `<title>` to a string derived from the route's resolved data:

- On the home route (`/[locale]`), the `<title>` SHALL be the localized `HomePage.title` string (e.g. "Learn English" / "Aprende inglés" / "Aprenda inglês").
- On the Lesson Page route (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`), the `<title>` SHALL be the resolved `lesson.title`. When the route resolves to an error (course not found, module not in course, lesson not in module), the `<title>` SHALL be a localized fallback that does NOT leak error details (e.g. "Not found" / "No encontrado" / "Não encontrado").

#### Scenario: Home route sets the localized title
- **WHEN** a user visits `/en` (or `/es`, `/pt`)
- **THEN** the document `<title>` is `"Learn English"` (or `"Aprende inglés"` / `"Aprenda inglês"` respectively)

#### Scenario: Lesson route sets the lesson title
- **WHEN** a user visits `/en/courses/english-a1-pronunciation/modules/vowels-and-video-intro/lessons/22222222-2222-4222-8222-222222222220` and the lesson resolves
- **THEN** the document `<title>` is `"Vowels: short vs. long"` (the lesson's title)

#### Scenario: Lesson route with an error sets a fallback title
- **WHEN** a user visits `/en/courses/does-not-exist/...` and the use case resolves to `course-not-found`
- **THEN** the document `<title>` is `"Not found"` (or the localized equivalent) — NOT the literal route path, NOT a UUID, NOT `"Create Next App"`

### Requirement: The Locale Not Found page is localized

When the application receives a request for a locale segment that is not in the configured `routing.locales` (e.g. `/xx`, `/de`), the application SHALL render a localized "Locale not supported" message at the locale-segment level (`src/app/[locale]/not-found.tsx`) with a link back to the default locale's home. The message SHALL be in the requested locale's text when that text exists, otherwise in the default locale's text.

#### Scenario: An unsupported locale renders the localized message
- **WHEN** a user visits `/xx`
- **THEN** the page renders a heading reading "Locale not supported" (or the localized equivalent) and a link pointing at `/en` (the default locale's home)

#### Scenario: The locale not-found page links to a working home
- **WHEN** the user clicks the "go home" affordance on the locale not-found page
- **THEN** the user lands on a 200-status page (the default-locale home) and NOT on a generic Next.js 404

### Requirement: The Resource kind label is the sole kind signal on a resource

A `Resource`'s rendered item SHALL show its kind via exactly one of (a) the icon chosen by `ResourceKind`, or (b) the kind label. The kind label SHALL NOT appear duplicated with information already in the title. If a seed or user-supplied resource title contains the kind suffix (e.g. `"Vowel chart (PDF)"`), the rendered item SHALL still show only one kind signal.

#### Scenario: A resource with a kind suffix in its title is rendered with a single kind signal
- **WHEN** a resource with `title: "Vowel chart (PDF)"` and `kind: "pdf"` is rendered in the Lesson Page's Resources card
- **THEN** the rendered DOM contains exactly one instance of the kind signal — either the icon, or the label, or both grouped once. It MUST NOT contain "Vowel chart (PDF) (PDF)" or any duplicated kind text

### Requirement: `next-themes` script-injection warning is documented as a known issue

The application SHALL keep `next-themes` as its theme provider. The React 19 console warning of the form `"Encountered a script tag while rendering React component"` that originates from `next-themes@0.4.6`'s `<ThemeProvider>` SHALL be documented in code as a known issue, not silently silenced by replacing the provider. The codebase's theme manager stays external (no custom re-implementation); the warning is a non-blocking artifact of the library that the upstream is migrating past.

#### Scenario: The warning is documented in the code
- **WHEN** a developer opens `src/components/theme-toggle/theme-toggle.tsx`
- **THEN** the file's JSDoc explains that the warning is from `next-themes@0.4.6` and that the codebase intentionally keeps the dependency rather than re-implementing the provider

#### Scenario: The warning does not break any route
- **WHEN** a user visits any route in the application with the browser DevTools console open
- **THEN** the page renders correctly and remains fully interactive despite the warning; navigation, theme toggling, and lesson-page flows all function as specified
