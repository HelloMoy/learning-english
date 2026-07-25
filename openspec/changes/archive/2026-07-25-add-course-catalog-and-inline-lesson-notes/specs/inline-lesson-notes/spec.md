## ADDED Requirements

### Requirement: Lesson notes are resolved by lesson identity through a storage-neutral port

The system SHALL expose a `LessonNotesRepository` port that resolves the Markdown notes associated with a `LessonId` without exposing filesystem paths or storage keys to the UI. The repository SHALL return a notes view containing the source `Resource` and UTF-8 Markdown text, or `null` when the lesson has no Markdown notes.

#### Scenario: A video lesson with readme notes resolves its notes
- **WHEN** `findLessonNotes` receives the id of a lesson whose folder contains `readme.md`
- **THEN** it returns the matching notes resource and the Markdown body

#### Scenario: A lesson without readme notes resolves cleanly
- **WHEN** `findLessonNotes` receives the id of `Welcome`, which has no `readme.md`
- **THEN** it returns `null` and does not turn the lesson into an error state

#### Scenario: Unknown lesson ids do not read arbitrary paths
- **WHEN** `findLessonNotes` receives an unknown or invalid lesson id
- **THEN** it returns a domain error or `null` according to the existing use-case error convention and performs no filesystem read based on user-supplied path text

### Requirement: Markdown notes render inline as safe server-side content

The Lesson Page SHALL render resolved Markdown notes below the video description under a localized `Notes` heading. Rendering SHALL support the current corpus' headings, paragraphs, emoji and basic lists while disabling raw HTML passthrough. When no notes exist, the notes region SHALL be omitted without an empty heading.

#### Scenario: Bilingual notes render as readable sections
- **WHEN** a video lesson has the current bilingual `readme.md` format
- **THEN** the Lesson Page renders its headings and paragraphs in the notes region without showing raw Markdown markers as the primary presentation

#### Scenario: Raw HTML is not executed or injected
- **WHEN** Markdown contains an HTML tag or script-like text
- **THEN** the rendered page does not execute it and does not use unsanitized `dangerouslySetInnerHTML`

#### Scenario: Notes are readable without color or hover state
- **WHEN** the notes region is viewed in light mode, dark mode or with keyboard navigation
- **THEN** headings, paragraphs and links remain distinguishable and operable

### Requirement: The original Markdown resource remains available

When inline notes are rendered, the Lesson Page SHALL retain an explicit link to the original Markdown resource in the Resources region. The link SHALL identify the resource format for assistive technology and SHALL not expose an arbitrary path outside the BlobStore-generated URL.

#### Scenario: A learner can open the source notes file
- **WHEN** a lesson has inline notes
- **THEN** the Resources region contains one link to the original notes resource in addition to the inline rendering

#### Scenario: Binary resources keep their existing behavior
- **WHEN** a lesson has a PDF, DOCX, PPTX or image resource
- **THEN** it remains a binary resource link and is not decoded as UTF-8 Markdown

### Requirement: Notes failures degrade to a useful resource state

A notes-read failure SHALL be logged or represented by the established delivery error policy without preventing the video, lesson title, navigation or binary resources from rendering. The UI SHALL offer the original notes resource when its URL is known.

#### Scenario: A missing notes blob does not break the lesson
- **WHEN** the generated notes key no longer exists on disk
- **THEN** the Lesson Page still renders the video and other regions, and the notes area shows no misleading content
