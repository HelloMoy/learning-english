# Ubiquitous Language — Course Platform

> The shared vocabulary for the course platform bounded context, used by
> domain experts, code, tests, i18n keys, and user-facing copy.
>
> **Audience:** domain experts, product, engineering, design, AI assistants.
> **Source of truth:** this file. When code, copy, or specs disagree, this
> wins. PRs that introduce new domain or UI vocabulary MUST update this
> file in the same change.
> **Last updated:** 2026-07-07

---

## Status legend

| Symbol | Meaning                                                       |
| :----: | ------------------------------------------------------------- |
|   🟢   | In use — code, i18n keys, or both                             |
|   🟡   | Defined — not yet implemented (deferred)                      |
|   🔴   | Rejected — do not use; see [Anti-terms](#anti-terms-rejected) |

---

## Concepts (alphabetical)

### Caption

🟡 Deferred to a future change. When shipped, this is a subtitle file attached to a **Lecture** (a `Lesson` of `kind: "video"`). Stored as WebVTT (`.vtt`) or SubRip (`.srt`). Source of truth for the interactive Transcript and for accessibility.

In v1 the `<video>` element renders without a caption track. Caption ships together with [Transcript](#transcript) in a follow-up — see [Deferred to a future change](#deferred-to-a-future-change).

Rejected: _subtitle_ (ambiguous — file vs interactive), _closed caption_ (we do not distinguish closed vs open).

See also: Transcript, Lecture, Player.

---

### Course

🟢 A structured learning product, owned by an **Instructor**, composed of **Modules** and **Lessons**. A **Learner** enrolls in a course to gain access to its lessons.

Example: _"Basic — Foundational Pronunciation"_.

See also: Module, Lesson, Enrollment, Instructor, Learner.

---

### Enrollment

🟡 A Learner's right to access a Course's content. Not yet implemented; will arrive with auth and persistence.

See also: Course, Learner.

---

### Instructor

🟡 The author of a **Course**. First-class entity in the data model; not yet implemented.

Rejected: _teacher_, _author_, _tutor_.

See also: Course, Learner.

---

### Learner

🟡 The human consuming a Course. Not yet a first-class entity; today the platform is unauthenticated. Will become the principal for Enrollment, Progress, and Notes.

Rejected: _user_, _student_ (academic tone; "learner" is the industry default — Coursera, Udemy, LinkedIn Learning, MasterClass).

See also: Instructor, Enrollment, Progress.

---

### Lecture

🟢 (data model) / 🟢 (copy) A **Lesson** whose primary content is a **Video** asset. In code, this is `Lesson { kind: "video", ... }`. In user-facing copy, _Lecture_ is the canonical term for a single video unit.

Example: _"Lecture 1.3 — Long vs Short Vowels"_.

Rejected: _video_ (describes the medium, not the unit), _tutorial_ (implies a step-by-step, not a concept lesson).

See also: Lesson, Player, Video, Transcript.

---

### Lesson

🟢 A single learning unit within a **Module**. Discriminated by `kind`. Today: `reading`. Adding: `video` (a **Lecture**). Future: `quiz`, `speaking`, `flashcard`, `interactive`.

Example: _"Long vs Short Vowels"_.

See also: Lecture, Module, Outline, Resource.

---

### Lesson Page

🟢 The page that displays a single **Lecture** (a Lesson of `kind: "video"`). The page renders the **Outline** sidebar (left), the **Player** (center), and the **Resources** + **Up next** cards (right rail). A **Mark as complete** affordance sits below the Player.

Route shape: `/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`. The route is locale-aware because the project uses `next-intl` and locale-aware `<Link>`.

See also: Lecture, Player, Outline, Resources, Up next, Mark as complete.

---

### Mark as complete

🟢 The action a Learner takes to mark a **Lesson** as done. In v1 this is a manual button below the **Player**; the action is **ephemeral** (in-memory state only) — no persistence until auth and progress tracking ship. Visually, the button toggles to a "Completed" state when activated.

When **Progress** ships (deferred), this action writes through a `markLessonComplete` use case to a durable store; the UI does not change.

See also: Lesson, Progress.

---

### Module

🟢 A grouping of related **Lessons** within a **Course**. A Lesson belongs to exactly one Module; a Module belongs to exactly one Course. The hierarchy is `Course → Module → Lesson`.

The **Outline** renders Modules as collapsible accordions; each Module lists its Lessons in `sequence` order. The breadcrumb on the **Lesson Page** reads `Course › Module › Lesson`.

Rejected: _section_ (Udemy), _chapter_ (edX, LinkedIn Learning), _unit_ (Khan Academy). All three are valid alternatives; **Module** wins on parity with Coursera and Frontend Masters, the two platforms with the closest product shapes.

See also: Course, Lesson, Outline, Lesson Page.

---

### Notes

🟡 Personal annotations a Learner attaches to a **Lecture** — either a free-form note or a note pinned to a Transcript segment (i.e., a timestamp). Not yet implemented.

See also: Lecture, Transcript, Progress.

---

### Outline

🟢 The left sidebar of the **Lesson Page** that lists a Course's Modules and Lessons in `sequence` order. Lets the Learner navigate within the Course and shows a check mark on completed lessons once Progress ships.

Rejected: _syllabus_ (academic tone, used in marketing copy but never in code), _curriculum_ (broader than the sidebar — the curriculum is the whole course; the outline is its representation in the UI), _table of contents_ (book metaphor, wrong domain).

See also: Course, Module, Lesson, Lesson Page.

---

### Player

🟢 The video playback UI rendered on the **Lesson Page** for a Lecture. In v1 this is the browser's native HTML5 `<video controls>` — no custom chrome, no custom overlay. The native control exposes: play/pause, scrubber, current time / duration, **Playback rate**, mute, volume, fullscreen, and a caption track toggle (the caption track ships in a future change).

The **Mark as complete** affordance sits **next to** the Player in the page footer, not in the Player chrome, because the native chrome cannot be extended.

When Caption and custom chrome become necessary, a wrapping component can be introduced without changing the domain.

Rejected: _video_ (the player is the UI; the video is the asset).

See also: Lecture, Playback rate, Caption, Transcript, Mark as complete.

---

### Playback rate

🟢 The speed multiplier of the **Player**. Allowed values: `0.5×`, `0.75×`, `1×`, `1.25×`, `1.5×`, `2×`. Default `1×`. Persisted per Learner in a future change (not in v1).

Rejected: _speed_ (ambiguous — could mean scrubber responsiveness, network speed, etc.).

See also: Player, Lecture.

---

### Progress

🟡 The Learner's completion state within a Course — which lessons are complete, current resume position per Lecture, percent of the Course completed. Not yet implemented. Will arrive with Persistence and a use case like `markLessonComplete` and `getResumePosition`.

See also: Lesson, Lecture, Resume.

---

### Resource

🟢 A supplementary file attached to a **Lesson** (typically a PDF handout, a slide deck, or a code archive). In v1, **Resource is a first-class domain entity** with its own `ResourceId` branded type, a `ResourceKind` enum, and a `ResourceRepository` port. The Lesson entity does NOT carry its Resources as a field — the Lesson Page's use case fetches the Lesson and the Resources separately and composes them in the view.

This is the v1 structure because it leaves the door open for cross-cutting queries (Workbook, resource analytics, shared Resources) without a future refactor of the lesson domain. See the [Decision log](#decision-log) entry 2026-07-07.

Surfaced in the Lesson Page's right rail under the heading _"Resources"_.

Rejected: _material_ (used in informal copy, ambiguous singular/plural), _handout_ (describes documents only), _attachment_ (a file system concept, not a domain concept).

See also: ResourceKind, ResourceRepository, Workbook, Lesson, Lesson Page.

---

### ResourceKind

🟢 The `kind` of a **Resource**. Allowed values: `pdf` (PDF handout), `slides` (slide deck), `code` (code archive / repository link), `other`. Stored on the Resource entity; the UI uses it to pick an icon and queries use it to filter by type.

See also: Resource.

---

### ResourceRepository

🟢 The driven port for **Resource** persistence. v1 surface:

- `byId(id: ResourceId): Promise<Resource | null>`
- `listByLesson(lessonId: LessonId): Promise<Resource[]>`
- `listByModule(moduleId: ModuleId): Promise<Resource[]>`
- `listByCourse(courseId: CourseId): Promise<Resource[]>` _(exists for parity; the Workbook view that uses it is deferred)_

See also: Resource, Lesson, Module, Course, Workbook.

---

### Resume

🟡 The action of continuing a Lecture from a saved **Progress** position, plus the affordance on the Lesson Page that says _"Resume at 12:34"_. Not yet implemented.

See also: Progress, Player, Up next.

---

### Transcript

🟡 Deferred to a future change. When shipped, this is the time-aligned text of a **Lecture**, surfaced as an interactive layer beneath the **Player**. A Transcript is an ordered list of **Segments**: each segment has `startSeconds`, `endSeconds`, and `text`. Clicking a Segment seeks the Player to `startSeconds`. The currently-active Segment is highlighted as the Lecture plays.

In v1 there is no Caption file and no Transcript — both ship in a future change. See [Deferred to a future change](#deferred-to-a-future-change).

The Transcript is **derived from** the Caption file; the Caption file is the source of truth, the Transcript is a presentation of it.

Rejected: _subtitle_ (file), _caption_ (file), _lyrics_ (wrong domain).

See also: Caption, Lecture, Player, Segment.

---

### Segment

🟡 A single entry in a **Transcript**: `{ startSeconds: number, endSeconds: number, text: string }`. The atomic unit of interactive transcript navigation.

See also: Transcript.

---

### Up next

🟢 The card on the Lesson Page's right rail that names and links to the next Lesson in the Course, or shows _"You've reached the end of the course"_ when the Learner is on the last Lesson. Implemented today by `CourseNavigator`; the Lesson Page will consume the same use case.

Rejected: _continue_ (overlaps with Resume), _next lesson_ (verbose; we promote _Lesson_ to the noun), _what next_ (conversational).

See also: Lesson, Course, Resume, CourseNavigator.

---

### Video

🟢 The asset referenced by a **Lecture**. In v1, a direct URL to an MP4 served from the same origin or a CDN. Future: HLS (`.m3u8`) for adaptive bitrate.

Rejected: _movie_ (entertainment metaphor), _clip_ (implies short).

See also: Lecture, Player.

---

### Workbook

🟡 A course-level collection of **Resources** (PDFs, slides, code samples) packaged for the entire Course. Distinct from per-Lesson resources. Not yet implemented; the data model is Lesson-scoped only in v1.

Rejected: _course pack_ (jargon), _materials_ (informal), _downloads_ (browser metaphor).

See also: Resource, Course.

---

## User-facing labels (v1 only)

Canonical English strings used in the v1 UI. i18n keys live under
`Components.<ComponentName>.*` in `src/messages/<locale>.json`.
Translated strings MUST preserve the canonical term's meaning; do not
paraphrase _Lecture_ as _class_ in Spanish if it changes the meaning.

| Label              | Component / area            | Suggested i18n key                                                                  |
| ------------------ | --------------------------- | ----------------------------------------------------------------------------------- |
| _Course_           | Breadcrumb, page header     | `Components.LessonPage.course`                                                      |
| _Module_           | Breadcrumb, outline header  | `Components.LessonPage.module`, `Components.Outline.module`                         |
| _Lesson_           | Generic UI strings          | `Components.LessonPage.lesson` (singular), `Components.LessonPage.lessons` (plural) |
| _Lecture_          | Title in the lesson area    | `Components.LessonPage.lecture`, `Components.LecturePlayer.title`                   |
| _Outline_          | Sidebar                     | `Components.LessonPage.outline`                                                     |
| _Resources_        | Right rail header + items   | `Components.LessonPage.resources`, `Components.ResourceList.item`                   |
| _Up next_          | Right rail card             | `Components.LessonPage.upNext`                                                      |
| _Course completed_ | Right rail (terminal)       | `Components.LessonPage.courseCompleted`                                             |
| _Mark as complete_ | Lesson footer               | `Components.LessonPage.markComplete`                                                |
| _Marked complete_  | Lesson footer (after click) | `Components.LessonPage.markedComplete`                                              |

Deferred features (Captions, Transcript, Notes, Q&A, etc.) are not
listed here; their i18n keys are added when those features ship.

---

## Anti-terms (rejected)

Words that appear in informal copy, in adjacent platforms, or in early
brainstorming — and that we explicitly do **not** use. Replace with the
canonical term in the row's "Say" column.

| Don't say    | Say                                                | Why                                                            |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| _class_      | _course_                                           | "Class" is a single instance (in CS) and has too much baggage. |
| _video_      | _lecture_ (unit) / _player_ (UI) / _video_ (asset) | The word is overloaded. Disambiguate by context.               |
| _material_   | _resource_                                         | Domain term, not a generic.                                    |
| _section_    | _module_                                           | Section is too generic; module groups lessons.                 |
| _chapter_    | _module_                                           | Book metaphor.                                                 |
| _unit_       | _module_                                           | Khan-specific; not the industry default.                       |
| _syllabus_   | _outline_ (in code), OK in copy                    | Outline is the UI; syllabus is a course overview document.     |
| _curriculum_ | _course_ (the body of content)                     | Curriculum is meta; course is the artifact.                    |
| _speed_      | _playback rate_                                    | Speed is ambiguous.                                            |
| _subtitle_   | _caption_ (file) / _transcript_ (interactive)      | Two distinct concerns.                                         |
| _teacher_    | _instructor_                                       | Industry default; aligns with the platform's tone.             |
| _student_    | _learner_                                          | Active role, not a status.                                     |
| _user_       | _learner_ (in this context)                        | "User" is a system term; "learner" is a domain term.           |
| _tutorial_   | _lecture_                                          | Tutorial implies step-by-step; lecture is a concept unit.      |
| _clip_       | _video_ (asset)                                    | Clip implies short.                                            |

---

## Decision log

| Date       | Decision                                                                         | Rationale                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-07 | **Module** over _Section_/_Chapter_/_Unit_                                       | Industry default (Coursera, Frontend Masters); matches the closest product shapes.                                                                                                                                                                |
| 2026-07-07 | **Outline** for the sidebar (code); _Syllabus_ allowed in marketing copy         | Avoids academic tone in code; preserves "syllabus" as a public-facing course-overview document.                                                                                                                                                   |
| 2026-07-07 | **Resource** for per-Lesson files; **Workbook** for course-level files           | Two scopes need two terms; "Resource" matches Coursera/LinkedIn Learning, "Workbook" matches MasterClass.                                                                                                                                         |
| 2026-07-07 | **Lecture** = `Lesson { kind: "video" }`                                         | Aligns with Udemy/Coursera naming for the video unit; "Lesson" stays the generic.                                                                                                                                                                 |
| 2026-07-07 | **Transcript** = interactive; **Caption** = file                                 | Two distinct concerns: one is a presentation, the other is a file.                                                                                                                                                                                |
| 2026-07-07 | **Lesson Page** is a single full page (sidebar + center + right rail)            | User decision; not a "player-only" component.                                                                                                                                                                                                     |
| 2026-07-07 | **Module ships in v1** (Course → Module → Lesson)                                | Adds the grouping layer now to avoid retrofitting the breadcrumb and the outline later.                                                                                                                                                           |
| 2026-07-07 | **Resources as first-class domain entity** in v1 (option B — not a Lesson field) | Pre-pays the cost of Workbook, analytics, and shared Resources; a future refactor would otherwise land mid-product.                                                                                                                               |
| 2026-07-07 | **Player uses native HTML5 `<video controls>`** in v1                            | Zero custom chrome to maintain; the browser already gives play/pause, scrubber, fullscreen, etc.                                                                                                                                                  |
| 2026-07-07 | **Mark as complete is manual only** in v1                                        | No position tracking yet; the user explicitly completes each lesson. Progress/Resume is deferred.                                                                                                                                                 |
| 2026-07-07 | **No sticky video on scroll** in v1                                              | Simpler layout; sticky is a v2 polish once the page composition is settled.                                                                                                                                                                       |
| 2026-07-07 | **Caption + Interactive Transcript deferred** to a future change                 | v1 has no `<track>` and no Transcript; accessibility/learning overlay lands in a follow-up.                                                                                                                                                       |
| 2026-07-07 | **Lesson content in Course's `language` only** (i18n Option A)                   | `title` and `description` are stored in a single string; the Course's `language` field is the source of truth. The UI chrome (buttons, headers) is translated via `next-intl` as before. Multilingual Lesson content (Option B) is a v2 refactor. |

---

## Deferred to a future change

The following glossary entries and concepts are deliberately **not in v1**. They are defined here so the language stays coherent across changes, but they are tracked separately when implemented.

- **Caption** + **Transcript** + **Segment** — the accessibility/learning overlay. Caption is a subtitle file served via `<track>`; the Transcript is an interactive layer derived from it. Neither ships in v1. See the [Caption](#caption) and [Transcript](#transcript) entries.
- **Progress** + **Resume** — track which Lessons are complete and resume a Lecture from a saved position. (Mark as complete ships as a manual, ephemeral action in v1; persistence is not.)
- **Workbook** — course-level view of all Resources in a Course. The **Resource** entity and **ResourceRepository** ship in v1, but a Workbook page that aggregates them does not.
- **Notes** — Learner annotations, optionally pinned to a Transcript Segment (i.e., a timestamp).
- **Enrollment** + **Learner** + **Instructor** — first-class entities that arrive with auth and persistence.

## Open questions (pending)

The following have not been decided. They are listed here so they
don't get lost; the next change touching the lesson view MUST resolve
each one or move it to a later change with a rationale.

- Is the **Outline** collapsible on mobile (drawer / accordion), or does it sit permanently in a narrow sidebar?
- Does the Lesson Page show a **breadcrumb** (Course › Module › Lesson) in v1?
- For the **Mark as complete** action: do we toggle a boolean in memory (ephemeral, lost on refresh) or persist it (cookie, localStorage, server)? Persistence requires an adapter port and is a v2 concern with auth — v1 will likely be ephemeral.
- Does the **Resource** URL need to be **signed** in v1 (e.g., a short-lived token), or is a static URL sufficient? (For local PDFs in `/public`, static is enough. For S3/CDN later, signing is required.)
- Does the **Resources** list group by `ResourceKind` in v1 (PDFs / Slides / Code), or render flat?
