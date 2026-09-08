## MODIFIED Requirements

### Requirement: The Lesson Page sets a per-page `<title>`

The application SHALL set the document `<title>` to a string derived from the route's resolved data:

- On the home route (`/[locale]`), the `<title>` SHALL be the localized `HomePage.title` string (e.g. "Learn English" / "Aprende inglés" / "Aprenda inglês").
- On the Lesson Page route (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`), the `<title>` SHALL be the resolved `lesson.title`. When the route resolves to an error (course not found, module not in course, lesson not in module), the `<title>` SHALL be a localized fallback that does NOT leak error details (e.g. "Not found" / "No encontrado" / "Não encontrado").

#### Scenario: Home route sets the localized title
- **WHEN** a user visits `/en` (or `/es`, `/pt`)
- **THEN** the document `<title>` is `"Learn English"` (or `"Aprende inglés"` / `"Aprenda inglês"` respectively)

#### Scenario: Lesson route sets the lesson title
- **WHEN** a user visits `/en/courses/basic-course/modules/1-introduction/lessons/0b06e639-efda-596d-8676-1e6e33410803` and the lesson resolves
- **THEN** the document `<title>` is `"Introduction"` (the lesson's title)

#### Scenario: Lesson route with an error sets a fallback title
- **WHEN** a user visits `/en/courses/does-not-exist/...` and the use case resolves to `course-not-found`
- **THEN** the document `<title>` is `"Not found"` (or the localized equivalent) — NOT the literal route path, NOT a UUID, NOT `"Create Next App"`
