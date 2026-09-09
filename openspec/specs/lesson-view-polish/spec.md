# Capability: lesson-view-polish

## Purpose

The `lesson-view-polish` capability captures a set of cross-cutting UX fixes for the Lesson Page discovered during the first Playwright walkthrough of the archived `add-lesson-view` change. It captures the **what** (the observable behavior of the polished surfaces), decoupled from any specific implementation detail.

Related capabilities carry their own deltas: dynamic metadata and error-state recovery lives in `lesson-page`; the `next-themes` runtime acknowledgement lives in `architecture-boundaries`.

The ubiquitous language is `GLOSSARY.md`.
## Requirements

### Requirement: The Lesson Page sets a per-page `<title>`

The application SHALL set the document `<title>` to a string derived from the route's resolved data, followed by the brand:

- Every route's title SHALL end in `· English Course`. A tab reading only `Introduction` names the page but not the product it belongs to, and a learner with several tabs open cannot tell which is this site.
- On the home route (`/[locale]`), the title's leading part SHALL be the localized `HomePage.title` string (e.g. "Learn English" / "Aprende inglés" / "Aprenda inglês").
- On the Lesson Page route (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`), the leading part SHALL be the resolved `lesson.title`. When the route resolves to an error (course not found, module not in course, lesson not in module), it SHALL be a localized fallback that does NOT leak error details (e.g. "Not found" / "No encontrado" / "Não encontrado").

The brand suffix SHALL come from a single title template rather than being appended per route, so no route can be left without it.

#### Scenario: Home route sets the localized title
- **WHEN** a user visits `/en` (or `/es`, `/pt`)
- **THEN** the document `<title>` is `"Learn English · English Course"` (or `"Aprende inglés · English Course"` / `"Aprenda inglês · English Course"` respectively)

#### Scenario: Lesson route sets the lesson title
- **WHEN** a user visits `/en/courses/basic-course/modules/1-introduction/lessons/0b06e639-efda-596d-8676-1e6e33410803` and the lesson resolves
- **THEN** the document `<title>` is `"Introduction · English Course"`

#### Scenario: Lesson route with an error sets a fallback title
- **WHEN** a user visits `/en/courses/does-not-exist/...` and the use case resolves to `course-not-found`
- **THEN** the document `<title>` is `"Not found · English Course"` (or the localized equivalent) — NOT the literal route path, NOT a UUID, NOT `"Create Next App"`

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

### Requirement: An unknown path under a supported locale renders a localized Page Not Found

When the application receives a request whose locale segment is one of the configured `routing.locales` but whose remaining path matches no route (e.g. `/es/error`, `/en/typo`, or `/xx` after the proxy rewrites it to `/en/xx`), it SHALL render a localized "Page not found" state.

The response SHALL carry HTTP status 404.

The page SHALL offer a link back to the home of the **active** locale, not the default locale: the learner's language is known and working, so sending a Spanish reader to the English home would discard information the request already carried.

The copy SHALL state that the *page* is missing. It SHALL NOT attribute the failure to the learner's language, which is supported in every case that reaches it.

The copy SHALL exist in every configured locale, so no learner reaching it sees a raw message key or another language's text.

#### Scenario: A mistyped path under a supported locale says the page is missing
- **WHEN** a user visits `/es/error`
- **THEN** the page states in Spanish that the page was not found, and does not state that the language is unsupported

#### Scenario: An unrecognized first segment is a missing page, not a missing language
- **WHEN** a user visits `/xx`
- **THEN** they are redirected to `/en/xx` and shown the page-not-found state, not a message about unsupported languages

#### Scenario: The response is still a 404
- **WHEN** a user visits any unknown path under a supported locale
- **THEN** the HTTP status is 404, not 200

#### Scenario: The home link preserves the active locale
- **WHEN** a user on `/pt/does-not-exist` activates the "go home" affordance
- **THEN** they land on the Portuguese home, and that page returns 200

#### Scenario: Every locale carries the copy
- **WHEN** the page renders in `en`, `es` or `pt`
- **THEN** it shows that locale's own text, and never a message key or a fallback in another language
