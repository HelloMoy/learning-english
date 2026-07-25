## MODIFIED Requirements

### RENAMED Requirement: BlobStore is the single point of URL resolution for course content

The previous requirement "BlobStore is the single point of URL resolution for course content" is renamed to "BlobStore is the single point of URL and text resolution for course content" and the body is updated.

### Requirement: BlobStore is the single point of URL and text resolution for course content

The system SHALL define a `BlobStore` interface under `src/adapters/persistence/blob-store/blob-store.ts` with these methods:

- `url(key: string): string` — returns the public URL for the given content key.
- `exists(key: string): Promise<boolean>` — returns whether a blob for the given key exists in the underlying store.
- `readText(key: string): Promise<string>` — reads a bounded UTF-8 text blob for a known key.

A "content key" is an opaque, store-agnostic identifier such as `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`. The key MUST be URL-safe (kebab-case ASCII, no spaces, no `&`/`#`/`:`, absolute prefixes or traversal segments). `readText` MUST be used only for generated text-resource keys and MUST NOT become a general arbitrary filesystem read API.

The `BlobStore` interface is a driven-adapter primitive. It MUST NOT live under `src/domain/ports/` and MUST NOT be imported by anything under `src/domain/**`; the domain reaches text content through `LessonNotesRepository`.

#### Scenario: A lesson adapter resolves a video URL via BlobStore

- **WHEN** `LocalFilesystemLessonRepository` builds a `VideoLesson.source` for a lesson whose video key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`
- **THEN** the resulting `source` value is exactly what `blobStore.url(key)` returns — no path concatenation in the adapter itself

#### Scenario: A resource adapter resolves a PDF URL via BlobStore

- **WHEN** `LocalFilesystemResourceRepository` builds a `Resource.url` for a PDF whose key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.pdf`
- **THEN** the resulting `url` value is exactly what `blobStore.url(key)` returns

#### Scenario: A notes adapter reads a known Markdown key through BlobStore

- **WHEN** a generated notes key points to a UTF-8 `readme.md` blob
- **THEN** `await blobStore.readText(key)` returns its text without exposing a local filesystem path to the caller

#### Scenario: A text read rejects traversal-like keys

- **WHEN** `readText` receives an absolute key or a key containing a `..` path segment
- **THEN** the adapter rejects it before filesystem or bucket access

### Requirement: LocalFilesystemBlobStore resolves keys to Next.js-served paths and bounded text reads

The system SHALL provide a `LocalFilesystemBlobStore` under `src/adapters/persistence/blob-store/local-filesystem-blob-store/` that:

- Accepts a single constructor argument `baseUrl: string` representing the public URL prefix under which the local filesystem content is served (e.g., `"/local-filesystem-lesson"`).
- Accepts a separate `localRoot: string` containing the absolute filesystem path to the local content directory.
- Implements `url(key)` as `` `${baseUrl}/${key}` `` — no leading slash duplication, no trailing slash on `baseUrl`.
- Implements `exists(key)` by calling `fs.access` against the safe absolute path resolved from `localRoot + key`.
- Implements `readText(key)` only after safe path validation, verifies the key is a Markdown/text resource, and reads UTF-8 content without following a path outside `localRoot`.

The `baseUrl` and `localRoot` MUST remain separate to prevent treating a filesystem path as a URL prefix or vice versa.

#### Scenario: LocalFilesystemBlobStore resolves a URL for a known content key

- **WHEN** constructed with `baseUrl = "/local-filesystem-lesson"` and `localRoot = "/abs/path/to/public/local-filesystem-lesson"`, and called with `url("course/lesson.mp4")`
- **THEN** the result is `"/local-filesystem-lesson/course/lesson.mp4"`

#### Scenario: LocalFilesystemBlobStore reports existence via filesystem check

- **WHEN** the file at `localRoot/key` exists
- **THEN** `await exists(key)` returns `true`

- **WHEN** the file at `localRoot/key` does not exist
- **THEN** `await exists(key)` returns `false`

#### Scenario: LocalFilesystemBlobStore reads a Markdown resource

- **WHEN** `localRoot/course/lesson/readme.md` exists and `readText("course/lesson/readme.md")` is called
- **THEN** it returns the file's UTF-8 text

#### Scenario: LocalFilesystemBlobStore does not read binary resources as notes

- **WHEN** `readText` receives a `.mp4`, `.pdf`, `.docx`, `.pptx` or image key
- **THEN** it rejects the request before reading the binary as UTF-8

### Requirement: Generated content includes a safe notes-key mapping

The build-time content generator SHALL emit enough server-side metadata for `LessonNotesRepository` to associate a lesson/resource identity with its normalized Markdown content key. The mapping MUST use the same normalized key validated by `BlobStore.exists`, MUST be generated rather than hand-authored, and MUST NOT be exposed as a client-facing arbitrary-path API.

#### Scenario: A bimodal lesson emits a notes key

- **WHEN** a lesson folder contains both an `.mp4` and `readme.md`
- **THEN** the generated seed metadata identifies the Markdown key for that lesson and `BlobStore.exists` validates it before the seed is written

#### Scenario: A missing notes key prevents an invalid mapping

- **WHEN** the generator cannot resolve the normalized `readme.md` key
- **THEN** generation fails without writing a partial seed or notes mapping
