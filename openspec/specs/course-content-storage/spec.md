# Capability: course-content-storage

## Purpose

Define how course content (videos, PDFs, thumbnails, supplementary markdown) is resolved to URLs at runtime, and how the seed data that drives the lesson/resource repositories is generated from a content source. The `BlobStore` abstraction decouples lesson/resource adapters from the underlying storage backend so the application can target a local filesystem in development and an S3-compatible bucket in production without changes to the domain or to the lesson/resource adapters.

This spec captures WHAT the storage layer must do. The domain entities and ports (`LessonRepository`, `ResourceRepository`, `BlobStore`) are defined in `openspec/specs/course-platform-domain/spec.md`; this spec is the storage-adapter counterpart.

## Requirements

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

### Requirement: LocalFilesystemBlobStore resolves keys to Next.js-served paths

The system SHALL provide a `LocalFilesystemBlobStore` under `src/adapters/persistence/blob-store/local-filesystem-blob-store/` that:

- Accepts a single constructor argument `baseUrl: string` representing the public URL prefix under which the local filesystem content is served (e.g., `"/local-filesystem-lesson"`).
- Implements `url(key)` as `` `${baseUrl}/${key}` `` — no leading slash duplication, no trailing slash on `baseUrl`.
- Implements `exists(key)` by calling `fs.access` against the absolute path resolved from the local content directory + key. The absolute path of the local content directory is passed via a second constructor argument `localRoot: string` (an absolute filesystem path, NOT a URL).

The `baseUrl` and `localRoot` MUST be passed separately to prevent the footgun of treating a filesystem path as a URL prefix or vice versa. The two arguments MUST NOT be derived from each other inside the constructor.

#### Scenario: LocalFilesystemBlobStore resolves a URL for a known content key

- **WHEN** constructed with `baseUrl = "/local-filesystem-lesson"` and `localRoot = "/abs/path/to/public/local-filesystem-lesson"`, and called with `url("course/lesson.mp4")`
- **THEN** the result is `"/local-filesystem-lesson/course/lesson.mp4"`

#### Scenario: LocalFilesystemBlobStore reports existence via filesystem check

- **WHEN** the file at `localRoot/key` exists
- **THEN** `await exists(key)` returns `true`

- **WHEN** the file at `localRoot/key` does not exist
- **THEN** `await exists(key)` returns `false`

### Requirement: Content seed is generated at build time, not at runtime

The system SHALL provide a build-time script `scripts/generate-course-content-seed.ts` that:

- Walks `public/local-filesystem-lesson/<course-slug>/` recursively.
- Emits `src/adapters/persistence/in-memory/seed/seed-content.ts` containing a `seedContentCourse`, `seedContentModules`, `seedContentLessonRows`, and `seedContentResourceRows`, PLUS the original pre-normalization names (see "Generated seed preserves the original pre-normalization names").
- Emits `seedContentCourse` and `seedContentModules` as parsed domain entities, because neither carries a content key. Emits lessons and resources as **raw rows** — plain objects whose `source`, `poster` and `url` fields hold content KEYS, not URLs — because a bare key does not satisfy `urlOrRelativePath()` and therefore cannot be parsed into a domain entity until an adapter has resolved it.
- Computes slugs for every folder using (a) the override map in `scripts/slug-overrides.ts` if present, otherwise (b) automatic kebab-case ASCII normalization.
- Slugifies EVERY path segment of each content key — the course, module, and lesson folder names AND the media/resource file basenames — using the same override + normalization logic, so the emitted key is kebab-case ASCII end to end. (Previously the file basename was preserved verbatim, which produced keys with spaces and accents that did not resolve on disk.)
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

The same `BlobStore` instance SHALL be shared by the lesson, resource and notes adapters within one dependency-graph build, so the three can never disagree about where content lives.

Repointing content storage SHALL NOT require regenerating `seed-content.ts`.

#### Scenario: Default boot preserves today's URLs

- **WHEN** the app boots with `USE_COURSE_CONTENT_SEED=1` and neither `CONTENT_BASE_URL` nor `CONTENT_LOCAL_ROOT` set
- **THEN** every rendered video, poster and resource URL is byte-identical to the pre-change output, all beginning with `/local-filesystem-lesson/`

#### Scenario: A CDN prefix is applied by configuration alone

- **WHEN** the app boots with `CONTENT_BASE_URL=https://cdn.example.com/course-content`
- **THEN** every rendered video, poster and resource URL begins with `https://cdn.example.com/course-content/`, and `seed-content.ts` is unchanged on disk

### Requirement: The notes adapter matches its resource by key, not by resolved URL

`LocalFilesystemLessonNotesRepository` SHALL locate a lesson's notes `Resource` by comparing content KEYS, not by reconstructing a URL with `BlobStore.url(key)` and string-matching it against `Resource.url`.

Matching on the resolved URL couples the notes adapter to the resource adapter having used an identically-configured `BlobStore`; when the two disagree the lookup returns `null` and notes silently disappear with no error. Key comparison removes that failure mode.

#### Scenario: Notes are found under a non-default base URL

- **WHEN** the app boots with `CONTENT_BASE_URL` set to something other than the default and a lesson with notes is opened
- **THEN** the notes markdown renders, because the lookup compared keys rather than base-URL-dependent strings

#### Scenario: A lesson with no notes still returns null

- **WHEN** `byLesson` is called for a lesson that has no entry in the notes key map
- **THEN** the adapter returns `null` without consulting the `BlobStore`

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

### Requirement: Lesson titles come from the notes heading for allowlisted modules

The generator SHALL derive a lesson's title from the first Markdown `#` heading of that lesson's `readme.md`, but only for modules named in an explicit, reviewed allowlist. For every module not in that allowlist, the title SHALL continue to be derived from the lesson slug, unchanged.

The allowlist SHALL be per-module, not per-lesson, and SHALL live in its own reviewed file alongside the slug overrides, so enabling a module is a single visible edit.

The heading SHALL be adopted only when it carries information the slug could not: if the heading equals the slug-derived title ignoring case, the slug-derived title SHALL be kept. A lesson whose `readme.md` is absent, or whose `readme.md` has no `#` heading, SHALL keep the slug-derived title.

The generator SHALL additionally consult a reviewed per-lesson title override table, keyed by the full `courseSlug/moduleSlug/lessonSlug` path. An override SHALL take precedence over both the heading and the slug, and SHALL apply whether or not its module is in the allowlist — it is already a per-lesson reviewed decision. The override table exists for lessons whose real name cannot be recovered automatically, such as a lesson with no `readme.md` at all.

The resolved title SHALL be applied once and used for both the lesson and its notes Resource, so the two can never disagree.

When a title is adopted from a heading, apostrophes SHALL be normalized to `’` (U+2019), so a module reads consistently regardless of which character its author typed. No other normalization SHALL be applied — not case, not punctuation spacing, not `&`/`and`. Override values SHALL be written correctly rather than normalized.

These rules SHALL apply to both video and reading lessons.

Reading the heading SHALL NOT change how lessons are classified, how slugs, sequences, ids, posters or resources are derived, or the contents of the notes Resource.

#### Scenario: A heading recovers notation the slug lost
- **WHEN** a lesson in an allowlisted module sits in a folder slugged `4-fast` and its `readme.md` opens with `# Fast /æ/`
- **THEN** the emitted lesson's title is `Fast /æ/`, not `Fast`

#### Scenario: Sibling folders that slugged identically become distinguishable
- **WHEN** several lessons in an allowlisted module occupy folders that all slug to the same human name, and each `readme.md` opens with a different heading
- **THEN** each emitted lesson carries its own heading as its title, so no two rows in the module display the same name

#### Scenario: A module outside the allowlist is untouched
- **WHEN** a lesson in a module absent from the allowlist has a `readme.md` whose heading differs from the slug-derived title
- **THEN** the emitted title is the slug-derived one, and the generated seed for that module is unchanged

#### Scenario: A heading that differs only in case is not adopted
- **WHEN** a lesson in an allowlisted module has the slug-derived title `Intro` and its `readme.md` opens with `# INTRO`
- **THEN** the emitted title remains `Intro`, because capitalization is not information the slug lost

#### Scenario: A lesson with no heading keeps the slug-derived title
- **WHEN** a lesson in an allowlisted module has no `readme.md`, or has one with no `#` heading
- **THEN** the emitted title is the slug-derived one and no error is raised

#### Scenario: An override supplies a title no automatic source can produce
- **WHEN** a lesson has no `readme.md`, so neither a heading nor anything but the mangled slug is available, and the override table has an entry for its full slug path
- **THEN** the emitted title is the override value

#### Scenario: An override outranks a heading
- **WHEN** a lesson in an allowlisted module has both a `readme.md` heading and an override entry
- **THEN** the override value wins, because it is the more specific reviewed decision

#### Scenario: The override reaches the notes Resource too
- **WHEN** an overridden lesson also emits a notes Resource
- **THEN** that Resource is titled from the same resolved title, so the lesson and its notes never show different names

#### Scenario: Apostrophes in an adopted heading are normalized
- **WHEN** one lesson's heading uses `'` (U+0027) and a sibling's uses `’` (U+2019)
- **THEN** both emitted titles use `’`, so the module does not mix the two characters

#### Scenario: Normalization does not reach beyond apostrophes
- **WHEN** an adopted heading contains mixed case, an ampersand, or irregular spacing around punctuation
- **THEN** those are emitted unchanged — only the apostrophe character is normalized

#### Scenario: Lesson identity survives a title change
- **WHEN** the generator is re-run after enabling a module or adding an override, and titles change
- **THEN** every lesson's id, slug, sequence, `source` and `poster` are unchanged, because ids are derived from the course, module and lesson slugs and never from the title

### Requirement: The content seed is opt-in via env var

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL construct dependencies from `seed-content.ts` only when the environment variable `USE_COURSE_CONTENT_SEED` is set to `"1"`. When unset or set to any other value, the existing A1 hardcoded seed (`seed.ts`) continues to be used.

The default behaviour (A1 seed) MUST NOT change as a side effect of this change landing — only an explicit opt-in flips the source.

#### Scenario: Default dev boot still uses the A1 seed

- **WHEN** a developer runs `pnpm dev` without setting `USE_COURSE_CONTENT_SEED`
- **THEN** `getCoursePlatformDeps()` returns adapters constructed from `seed.ts`, identical to pre-change behaviour

#### Scenario: Opt-in boot uses the content seed

- **WHEN** a developer runs `USE_COURSE_CONTENT_SEED=1 pnpm dev`
- **THEN** `getCoursePlatformDeps()` returns adapters constructed from `seed-content.ts`, and the application surfaces the "Advanced Intermediate Pronunciation" course

### Requirement: Slug overrides are explicit and per-folder

`scripts/slug-overrides.ts` SHALL export a `Record<string, string>` keyed by the raw folder name (exactly as it appears on disk, including spaces and special characters), with values being the desired slug. The script SHALL apply the override BEFORE automatic normalization and SHALL fall back to automatic normalization when no entry is present.

The override file SHALL be reviewed in code review whenever content is added; an absent entry is a deliberate choice to accept the automatic slug.

#### Scenario: An override forces a specific slug

- **WHEN** `slug-overrides.ts` contains `{"1 Day#1": "1-day-01"}` and the folder name is `"1 Day#1"`
- **THEN** the generated lesson slug is `"1-day-01"`, NOT the automatic `"1-day-1"`

#### Scenario: An absent override falls back to automatic normalization

- **WHEN** `slug-overrides.ts` does not contain an entry for folder `"Intro"` and the folder name is `"Intro"`
- **THEN** the generated slug is `"intro"` (automatic normalization, no change)

### Requirement: On-disk content layout is normalized to match slug keys

The system SHALL provide a build-time normalization step that renames every folder AND every media/resource file under `public/local-filesystem-lesson/` to its kebab-case slug form, using the SAME slug resolution as the seed generator (`scripts/slug-overrides.ts` override map first, then `scripts/slug.ts` automatic normalization). After normalization, the physical path of each asset (relative to the content root) SHALL be byte-for-byte equal to the content key the generator emits, so `blobStore.url(key)` resolves against Next.js `/public`.

Normalization SHALL be idempotent (`slugify(slugify(x)) === slugify(x)`), so re-running it against an already-normalized tree makes no changes. If two distinct raw names within the same parent directory normalize to the same slug, the step SHALL abort with a non-zero status and name the colliding entries, without performing a partial rename of that directory.

#### Scenario: A folder with spaces, capitals, and special characters is renamed

- **WHEN** normalization encounters the folder `"8 Everyday English Phrases PART 2 Master Them!"`
- **THEN** it is renamed on disk to `"8-everyday-english-phrases-part-2-master-them"`

#### Scenario: A media file basename with spaces and accents is renamed

- **WHEN** normalization encounters the file `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** it is renamed on disk to `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"` (extension preserved, stem slugified)

#### Scenario: Re-running normalization on an already-normalized tree is a no-op

- **WHEN** normalization runs a second time against a tree whose every entry is already its slug
- **THEN** no rename occurs and the step exits zero

#### Scenario: A slug collision aborts without partial renames

- **WHEN** two sibling folders `"Intro"` and `"intro!"` both normalize to `"intro"`
- **THEN** the step exits non-zero, reports both colliding raw names, and leaves that directory unchanged

### Requirement: Generated seed preserves the original pre-normalization names

The generated `src/adapters/persistence/in-memory/seed/seed-content.ts` SHALL record, for every course, module, lesson, and resource, the ORIGINAL raw name exactly as it appeared on disk before normalization (folder name for course/module/lesson; file basename for media and resources). The slug→original mapping SHALL be recoverable from the seed alone, so the human-readable source names survive the rename and remain queryable without re-reading the disk.

Because the rename destroys the original names on disk and the generator runs after normalization, the original names SHALL be sourced from the `rename-manifest.json` written by the normalization step (`originalRelativePath → slugRelativePath`). When no manifest entry exists for an item (e.g. content already normalized with no recorded history), the generator SHALL fall back to the item's current on-disk name and MUST NOT fail generation on that account.

The original-name data MUST be emitted by the generator (not hand-authored) and committed alongside the rest of the seed.

#### Scenario: A module entry carries its original folder name

- **WHEN** the module folder `"8 Everyday English Phrases PART 2 Master Them!"` is normalized to slug `"8-everyday-english-phrases-part-2-master-them"`
- **THEN** the generated seed exposes, for that module, the original name `"8 Everyday English Phrases PART 2 Master Them!"` keyed to its slug/id

#### Scenario: A resource entry carries its original filename

- **WHEN** a PDF `"Vowel Chart (v2).pdf"` is normalized to `"vowel-chart-v2.pdf"`
- **THEN** the generated seed exposes, for that resource, the original filename `"Vowel Chart (v2).pdf"`

### Requirement: Generator validates that every emitted key resolves on disk

`scripts/generate-course-content-seed.ts` SHALL call `BlobStore.exists(key)` for every content key it emits (`VideoLesson.source`, `VideoLesson.poster`, and each `Resource.url` key). If any key does not resolve to a file under the content root, the generator SHALL exit non-zero with a message naming the offending key(s) and SHALL NOT write a partial `seed-content.ts`. This closes the slug↔disk drift that previously shipped silently.

#### Scenario: All emitted keys resolve

- **WHEN** every folder and file under the content root has been normalized and the generator runs
- **THEN** every `exists(key)` returns `true`, and `seed-content.ts` is written

#### Scenario: An unresolved key fails the generation loudly

- **WHEN** the generator emits a key whose file is missing on disk (e.g., disk not yet normalized)
- **THEN** the generator exits non-zero, names the unresolved key, and does not overwrite the existing `seed-content.ts`
### Requirement: Lesson notes bodies carry explicit language sections

A lesson `readme.md` that presents its content in more than one language SHALL mark each
language with a level-2 heading naming that language (for example `## Español` and
`## English`), placed after the lesson's `#` title heading. All of that language's content —
descriptive sub-headings, paragraphs, lists, blockquotes, examples — SHALL live beneath its
language heading, nested at `###` or deeper.

This shape is what the Lesson Page's Notes tab reads to render its "Español" / "English"
columns (see `cinema-lesson-view`). Notes bodies SHALL NOT rely on paragraph ordering or on a
particular number of blank-line-separated blocks to convey which language a passage is in.

A lesson whose notes exist in a single language SHALL still mark that language with its own
level-2 heading, so a monolingual lesson is explicit rather than merely ambiguous.

#### Scenario: A bilingual lesson body is structured by language

- **WHEN** a lesson's `readme.md` presents the same lesson in Spanish and in English
- **THEN** the body carries a `## Español` section and a `## English` section, each holding that language's sub-headings, paragraphs and lists

#### Scenario: A monolingual lesson body still names its language

- **WHEN** a lesson's `readme.md` presents content in English only
- **THEN** the body carries a single `## English` section rather than bare paragraphs under the title

#### Scenario: Reformatting a notes body leaves the title heading untouched

- **WHEN** a lesson's `readme.md` body is restructured into language sections
- **THEN** the file's first `#` heading is unchanged byte-for-byte, so lesson-title derivation for allowlisted modules and the generated `seed-content.ts` are unaffected
