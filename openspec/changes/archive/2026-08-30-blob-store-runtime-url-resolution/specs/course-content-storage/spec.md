## MODIFIED Requirements

### Requirement: BlobStore is the single point of URL resolution for course content

The system SHALL define a `BlobStore` interface under `src/adapters/persistence/blob-store/blob-store.ts` with three methods:

- `url(key: string): string` — returns the public URL for the given content key.
- `exists(key: string): Promise<boolean>` — returns whether a blob for the given key exists in the underlying store.
- `readText(key: string): Promise<string>` — reads a bounded UTF-8 text blob for a known text key.

A "content key" is an opaque, store-agnostic identifier such as `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`. The key MUST be URL-safe (kebab-case ASCII, no spaces, no `&`/`#`/`:`).

The `BlobStore` interface is a driven-adapter primitive. It MUST NOT live under `src/domain/ports/` and MUST NOT be imported by anything under `src/domain/**` (the `architecture-boundaries` spec continues to hold).

URL resolution SHALL happen exactly once, at read time, inside the lesson and resource adapters. No other layer — not the generator, not the seed, not the UI — SHALL concatenate a base URL onto a content key. A content key SHALL NOT appear in any value handed to the domain: the adapters resolve keys before constructing entities, so `VideoLesson.source`, `VideoLesson.poster` and `Resource.url` are always fully-formed URLs or site-relative paths by the time a domain schema parses them.

#### Scenario: A lesson adapter resolves a video URL via BlobStore

- **WHEN** `LocalFilesystemLessonRepository` builds a `VideoLesson.source` for a lesson whose video key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`
- **THEN** the resulting `source` value is exactly what `blobStore.url(key)` returns — no path concatenation in the adapter itself

#### Scenario: A resource adapter resolves a PDF URL via BlobStore

- **WHEN** `LocalFilesystemResourceRepository` builds a `Resource.url` for a PDF whose key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.pdf`
- **THEN** the resulting `url` value is exactly what `blobStore.url(key)` returns

#### Scenario: Swapping the BlobStore changes every content URL without regenerating the seed

- **WHEN** the same `seed-content.ts` is used to build the adapters twice, once with a `BlobStore` whose `url(key)` returns `/local-filesystem-lesson/<key>` and once with one returning `https://cdn.example.com/<key>`
- **THEN** every `VideoLesson.source`, `VideoLesson.poster` and `Resource.url` read from the second set of adapters carries the `https://cdn.example.com/` prefix, and no file on disk was regenerated

### Requirement: Content seed is generated at build time, not at runtime

The system SHALL provide a build-time script `scripts/generate-course-content-seed.ts` that:

- Walks `public/local-filesystem-lesson/<course-slug>/` recursively.
- Emits `src/adapters/persistence/in-memory/seed/seed-content.ts` containing a `seedContentCourse`, `seedContentModules`, `seedContentLessonRows`, and `seedContentResourceRows`, PLUS the original pre-normalization names (see "Generated seed preserves the original pre-normalization names").
- Emits `seedContentCourse` and `seedContentModules` as parsed domain entities, because neither carries a content key. Emits lessons and resources as **raw rows** — plain objects whose `source`, `poster` and `url` fields hold content KEYS, not URLs — because a bare key does not satisfy `urlOrRelativePath()` and therefore cannot be parsed into a domain entity until an adapter has resolved it.
- Computes slugs for every folder using (a) the override map in `scripts/slug-overrides.ts` if present, otherwise (b) automatic kebab-case ASCII normalization.
- Slugifies EVERY path segment of each content key — the course, module, and lesson folder names AND the media/resource file basenames — using the same override + normalization logic, so the emitted key is kebab-case ASCII end to end.
- Extracts `durationSeconds` for each `.mp4` via `ffprobe`. If `ffprobe` is not on `PATH`, the script exits with a non-zero status and a message instructing the developer to install it.
- Emits content KEYS for every `VideoLesson.source`, `VideoLesson.poster` and `Resource.url`. The generator SHALL NOT resolve keys to URLs and SHALL NOT contain a base-URL literal; the public URL prefix is not knowable at generation time because it is a deployment concern.
- Validates every emitted key via `BlobStore.exists(key)` and fails non-zero without a partial write if any key is unresolved (see "Generator validates that every emitted key resolves on disk"). The generator MAY construct a `BlobStore` for this existence check alone; it MUST NOT use it to bake URLs into the output.

The generated file MUST be committed to git. The script MAY be re-run by hand (`pnpm generate:content-seed`) when content is added or removed; CI does not run it.

#### Scenario: A new lesson is added by dropping files in the content folder

- **WHEN** a developer adds a new folder under `public/local-filesystem-lesson/<course>/<new-lesson>/` containing `lesson.mp4` and `notes.pdf`, then runs the normalization step and `pnpm generate:content-seed`
- **THEN** `seed-content.ts` contains a new video lesson row with a stable slug and a new resource row for the PDF, both with fully-slugified keys that resolve on disk, and both visible in the git diff

#### Scenario: The generated seed contains no base-URL prefix

- **WHEN** `pnpm generate:content-seed` completes
- **THEN** no `source`, `poster` or `url` value in `seed-content.ts` begins with `/local-filesystem-lesson` or any other base-URL prefix — each is a bare content key beginning with the course slug

#### Scenario: A folder name with special characters gets a clean slug

- **WHEN** the script encounters folder `"5 Sound Natural: American Intonation Essentials"`
- **THEN** the generated module slug is `"5-sound-natural-intonation-essentials"` (automatic normalization) UNLESS an entry in `slug-overrides.ts` maps the raw name to a different slug

#### Scenario: A media file basename is slugified into the key

- **WHEN** a lesson folder contains `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** the emitted `source` key ends in `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"`, and the same slug is the file's name on disk after normalization

#### Scenario: A duplicate `.mp4` filename inside the same section still produces unique keys

- **WHEN** two lesson folders in the same section each contain a file that slugifies to `aprende-ingles-americano-con-fluidez-desde-cero.mp4`
- **THEN** the generated keys are different because each lesson key includes the lesson slug, not the bare filename

#### Scenario: Missing ffprobe fails loudly

- **WHEN** the developer runs `pnpm generate:content-seed` and `ffprobe` is not on `PATH`
- **THEN** the script exits non-zero with stderr "ffprobe not found; install ffmpeg or set FFPROBE_PATH" and does not write a partial `seed-content.ts`

### Requirement: Lesson-vs-Resource discrimination uses file presence, not folder name

The script SHALL classify each lesson folder as follows:

- If the folder contains an `.mp4` file, the lesson is `kind: "video"` with `source` set to the video's content KEY.
- If the folder contains a `readme.md` AND no `.mp4`, the lesson is `kind: "reading"` with `body` set to the file's contents.
- If the folder contains BOTH an `.mp4` and a `readme.md`, the lesson is `kind: "video"` and the `readme.md` is emitted as a resource row `{ kind: "other", title: "<lesson-title> notes", url: <readme-key> }`.
- Any other file (PDF, DOCX, image) in a lesson folder becomes a resource row whose `kind` is derived from the file extension: `.pdf` → `"pdf"`, `.pptx`/`.key` → `"slides"`, anything else → `"other"`.
- The first `.jpeg`/`.jpg`/`.png` in a video lesson folder becomes the row's `poster` KEY. Subsequent images are ignored for poster purposes (they are not surfaced in v1).

#### Scenario: A video lesson with a PDF and a thumbnail

- **WHEN** a lesson folder contains `video.mp4`, `thumbnail.jpeg`, and `handout.pdf`
- **THEN** the generator emits a video lesson row with `source` set to the video key and `poster` set to the thumbnail key, AND a resource row `{ kind: "pdf", title: "handout", url: <pdf-key> }`

#### Scenario: A reading-only lesson with a readme and a docx

- **WHEN** a lesson folder contains `notes.md` (no video) and `exercise.docx`
- **THEN** the generator emits a reading lesson row with `body` set to the markdown contents, AND a resource row `{ kind: "other", title: "exercise", url: <docx-key> }`

#### Scenario: A bimodal lesson (video + readme) collapses the readme into a resource

- **WHEN** a lesson folder contains both `lesson.mp4` and `notes.md`
- **THEN** the generator emits a video lesson row (NOT a new bimodal kind) AND a resource row `{ kind: "other", title: "<lesson-title> notes", url: <notes-key> }`

## ADDED Requirements

### Requirement: Lesson and resource adapters resolve content keys at read time

`LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository` SHALL accept raw seed rows and a `BlobStore` in their constructors. For every row they return, they SHALL resolve the key-bearing fields through `BlobStore.url(key)` and THEN parse the result with the domain schema (`Lesson.parse` / `Resource.parse`), so a row that resolves to an invalid URL is rejected at the adapter boundary rather than reaching the UI.

These two adapters SHALL be the ones wired for the content seed. The pass-through `InMemoryLessonRepository` and `InMemoryResourceRepository` continue to serve the A1 hardcoded seed, which carries no keys.

Resolution SHALL be applied to `VideoLesson.source`, `VideoLesson.poster` (when present) and `Resource.url`. A `ReadingLesson` row has no key-bearing field and SHALL be parsed unchanged.

#### Scenario: A video lesson row is resolved and parsed on read

- **WHEN** `LocalFilesystemLessonRepository` is constructed with a row whose `source` is the key `course/module/lesson/video.mp4` and a `BlobStore` returning `https://cdn.example.com/<key>`, and `byId` is called for that lesson
- **THEN** the returned `VideoLesson` has `source` equal to `https://cdn.example.com/course/module/lesson/video.mp4` and is a fully parsed domain entity

#### Scenario: An absent poster stays absent

- **WHEN** a video lesson row has no `poster` field
- **THEN** the returned `VideoLesson` has no `poster`, and `BlobStore.url` is not called for it

#### Scenario: A reading lesson row needs no resolution

- **WHEN** `LocalFilesystemLessonRepository` returns a `ReadingLesson` row
- **THEN** the row is parsed unchanged and `BlobStore.url` is not called for it

#### Scenario: A row that resolves to an invalid URL is rejected at the adapter

- **WHEN** a row's key resolves through a misconfigured `BlobStore` to a value that is neither an absolute http(s) URL nor a site-relative path
- **THEN** the adapter throws the schema's validation error rather than returning a malformed entity

### Requirement: The BlobStore driver is selected by configuration

`use-case-dependencies.ts` SHALL choose the `BlobStore` implementation and its public URL prefix from environment variables rather than from a hardcoded literal:

- `CONTENT_BASE_URL` sets the public URL prefix. When unset it SHALL default to `/local-filesystem-lesson`, preserving today's behaviour exactly.
- `CONTENT_LOCAL_ROOT` sets the absolute filesystem path the local driver reads from. When unset it SHALL default to `public/local-filesystem-lesson` resolved against the process working directory.

The same `BlobStore` instance SHALL be shared by the lesson, resource and notes adapters within one `buildDeps` call, so the three can never disagree about where content lives.

Repointing content storage SHALL NOT require regenerating `seed-content.ts`.

#### Scenario: Default boot preserves today's URLs

- **WHEN** the app boots with `USE_COURSE_CONTENT_SEED=1` and neither `CONTENT_BASE_URL` nor `CONTENT_LOCAL_ROOT` set
- **THEN** every rendered video, poster and resource URL is byte-identical to the pre-change output, all beginning with `/local-filesystem-lesson/`

#### Scenario: A CDN prefix is applied by configuration alone

- **WHEN** the app boots with `CONTENT_BASE_URL=https://cdn.example.com/course-content`
- **THEN** every rendered video, poster and resource URL begins with `https://cdn.example.com/course-content/`, and `seed-content.ts` is unchanged on disk

### Requirement: The image allowlist is derived from the content base URL

Course posters are rendered through `next/image`, which rejects any remote host absent from `images.remotePatterns`. `next.config.ts` SHALL therefore derive that pattern from `CONTENT_BASE_URL`, so pointing content at a bucket or CDN does not additionally require editing the Next.js config by hand.

When `CONTENT_BASE_URL` is unset or holds a site-relative prefix, the config SHALL produce NO remote pattern — images are served from the app's own origin exactly as before.

The derived pattern SHALL be scoped to the configured path prefix rather than the whole host, so widening the content URL does not implicitly allowlist every image on that domain.

#### Scenario: A remote content prefix renders posters instead of erroring

- **WHEN** the app boots with `CONTENT_BASE_URL=https://cdn.example.com/course-content` and a page containing a `next/image` poster is requested
- **THEN** the page renders and the poster is served through Next's image optimizer, rather than failing with "Invalid src prop … hostname is not configured"

#### Scenario: The default local prefix adds no remote pattern

- **WHEN** `CONTENT_BASE_URL` is unset, or set to a site-relative value such as `/local-filesystem-lesson`
- **THEN** `images.remotePatterns` is empty and image handling is unchanged from before this capability existed

### Requirement: The notes adapter matches its resource by key, not by resolved URL

`LocalFilesystemLessonNotesRepository` SHALL locate a lesson's notes `Resource` by comparing content KEYS, not by reconstructing a URL with `BlobStore.url(key)` and string-matching it against `Resource.url`.

Matching on the resolved URL couples the notes adapter to the resource adapter having used an identically-configured `BlobStore`; when the two disagree the lookup returns `null` and notes silently disappear with no error. Key comparison removes that failure mode.

#### Scenario: Notes are found under a non-default base URL

- **WHEN** the app boots with `CONTENT_BASE_URL` set to something other than the default and a lesson with notes is opened
- **THEN** the notes markdown renders, because the lookup compared keys rather than base-URL-dependent strings

#### Scenario: A lesson with no notes still returns null

- **WHEN** `byLesson` is called for a lesson that has no entry in the notes key map
- **THEN** the adapter returns `null` without consulting the `BlobStore`
