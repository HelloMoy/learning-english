## ADDED Requirements

### Requirement: A lesson's video source may be declared as an external URL

`courses.manifest.json` SHALL support an optional per-course `lessonVideoSources`
table mapping `moduleSlug/lessonSlug` to an absolute `http(s)` URL. When a lesson
has an entry, the generator SHALL emit that URL as the lesson's `source` instead
of the content key derived from the `.mp4` on disk.

A key SHALL be a two-segment `moduleSlug/lessonSlug` pair, validated the same way
`lessonTitleOverrides` keys are: a bare lesson slug is ambiguous across modules,
and a course-prefixed key could name a course other than the entry's own. A value
that is not an absolute `http(s)` URL SHALL be rejected — a content key written
here would silently resolve against the local store and defeat the field.

The table SHALL affect `source` only. `poster`, `Resource.url` and lesson notes
keep their content keys and their existing resolution, so a lesson served from
YouTube still carries a locally-stored thumbnail and locally-stored resources.

An absent table, or an absent entry, SHALL leave the lesson's derived content key
untouched, so a manifest that declares no `lessonVideoSources` produces a
byte-identical seed.

Declaring an entry SHALL NOT require removing the lesson's local video file. The
on-disk `.mp4` remains the source of `durationSeconds`, which the generator reads
with `ffprobe` and which the domain requires.

#### Scenario: A declared lesson emits its external URL

- **WHEN** the manifest declares `lessonVideoSources` entry `2-vowels/1-the-vowel-sound-schwa` → `https://www.youtube.com/embed/27WXXMFimvE` and the generator runs
- **THEN** that lesson's row in `seed-content.ts` has `source` equal to `https://www.youtube.com/embed/27WXXMFimvE`, and its `poster` is still the content key derived from the lesson folder's image

#### Scenario: An undeclared lesson keeps its content key

- **WHEN** a course declares no `lessonVideoSources`, or declares a table with no entry for a given lesson, and the generator runs
- **THEN** every lesson in that course carries the content key derived from its on-disk `.mp4`, exactly as before

#### Scenario: A declared lesson still reports the local file's duration

- **WHEN** a lesson has a `lessonVideoSources` entry and its `.mp4` is still on disk
- **THEN** the emitted row's `durationSeconds` is the duration `ffprobe` reports for that local file

#### Scenario: A malformed key is rejected

- **WHEN** the manifest declares a `lessonVideoSources` key that is not a two-segment `moduleSlug/lessonSlug` pair, such as `1-the-vowel-sound-schwa` or `basic-course/2-vowels/1-the-vowel-sound-schwa`
- **THEN** parsing the manifest fails with a message naming the offending key and the shape a key must have

#### Scenario: A value that is not an absolute URL is rejected

- **WHEN** the manifest declares a `lessonVideoSources` value that is a content key or a site-relative path rather than an absolute `http(s)` URL
- **THEN** parsing the manifest fails with a message naming the offending entry

## MODIFIED Requirements

### Requirement: BlobStore is the single point of URL resolution for course content

The system SHALL define a `BlobStore` interface under `src/adapters/persistence/blob-store/blob-store.ts` with three methods:

- `url(key: string): string` — returns the public URL for the given content key.
- `exists(key: string): Promise<boolean>` — returns whether a blob for the given key exists in the underlying store.
- `readText(key: string): Promise<string>` — reads a bounded UTF-8 text blob for a known text key.

A "content key" is an opaque, store-agnostic identifier such as `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`. The key MUST be URL-safe (kebab-case ASCII, no spaces, no `&`/`#`/`:`).

The `BlobStore` interface is a driven-adapter primitive. It MUST NOT live under `src/domain/ports/` and MUST NOT be imported by anything under `src/domain/**` (the `architecture-boundaries` spec continues to hold).

URL resolution SHALL happen exactly once, at read time, inside the lesson and resource adapters. No other layer — not the generator, not the seed, not the UI — SHALL concatenate a base URL onto a content key. A content key SHALL NOT appear in any value handed to the domain: the adapters resolve keys before constructing entities, so `VideoLesson.source`, `VideoLesson.poster` and `Resource.url` are always fully-formed URLs or site-relative paths by the time a domain schema parses them.

A seed value that is ALREADY an absolute `http(s)` URL is not a content key and SHALL bypass `BlobStore` entirely rather than being resolved through it. This is the one exception to single-point resolution, and it is what lets a lesson be served by a third party (a `lessonVideoSources` entry pointing at YouTube) while every other asset in the same lesson stays keyed. Passing such a value to `BlobStore.url()` would prepend the store's base and produce a nonsense URL, so the exception is a correctness requirement, not a convenience.

#### Scenario: A lesson adapter resolves a video URL via BlobStore

- **WHEN** `LocalFilesystemLessonRepository` builds a `VideoLesson.source` for a lesson whose video key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`
- **THEN** the resulting `source` value is exactly what `blobStore.url(key)` returns — no path concatenation in the adapter itself

#### Scenario: A resource adapter resolves a PDF URL via BlobStore

- **WHEN** `LocalFilesystemResourceRepository` builds a `Resource.url` for a PDF whose key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.pdf`
- **THEN** the resulting `url` value is exactly what `blobStore.url(key)` returns

#### Scenario: Swapping the BlobStore changes every content URL without regenerating the seed

- **WHEN** the same `seed-content.ts` is used to build the adapters twice, once with a `BlobStore` whose `url(key)` returns `/local-filesystem-lesson/<key>` and once with one returning `https://cdn.example.com/<key>`
- **THEN** every `VideoLesson.source`, `VideoLesson.poster` and `Resource.url` read from the second set of adapters carries the `https://cdn.example.com/` prefix, and no file on disk was regenerated

#### Scenario: An absolute URL in the seed bypasses the store

- **WHEN** a lesson row's `source` is `https://www.youtube.com/embed/yY7RWGUbqng` and the adapter reads it with a `BlobStore` whose `url(key)` returns `/local-filesystem-lesson/<key>`
- **THEN** the returned `VideoLesson.source` is exactly `https://www.youtube.com/embed/yY7RWGUbqng`, with no base URL prepended

### Requirement: Lesson and resource adapters resolve content keys at read time

`LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository` SHALL accept raw seed rows and a `BlobStore` in their constructors. For every row they return, they SHALL resolve the key-bearing fields through `BlobStore.url(key)` and THEN parse the result with the domain schema (`Lesson.parse` / `Resource.parse`), so a row that resolves to an invalid URL is rejected at the adapter boundary rather than reaching the UI.

These two adapters SHALL be the ones wired for the content seed, and — because the content seed is the whole catalog — the only lesson and resource adapters the dependency graph builds.

Resolution SHALL be applied to `VideoLesson.source`, `VideoLesson.poster` (when present) and `Resource.url`. A `ReadingLesson` row has no key-bearing field and SHALL be parsed unchanged.

A field whose value is already an absolute `http(s)` URL SHALL be passed through unchanged instead of being resolved, because it is not a content key. Detection SHALL be by the value's own shape, not by which course or lesson it belongs to, so the rule holds for any row from any source.

#### Scenario: A video lesson row is resolved and parsed on read

- **WHEN** `LocalFilesystemLessonRepository` is constructed with a row whose `source` is the key `course/module/lesson/video.mp4` and a `BlobStore` returning `https://cdn.example.com/<key>`, and `byId` is called for that lesson
- **THEN** the returned `VideoLesson` has `source` equal to `https://cdn.example.com/course/module/lesson/video.mp4` and is a fully parsed domain entity

#### Scenario: A YouTube-hosted lesson keeps its local poster

- **WHEN** `LocalFilesystemLessonRepository` reads a row whose `source` is `https://www.youtube.com/embed/yY7RWGUbqng` and whose `poster` is the key `basic-course/2-vowels/3-the-vowel-sound-uu/thumb.jpeg`, with a `BlobStore` returning `/local-filesystem-lesson/<key>`
- **THEN** the returned `VideoLesson` has `source` unchanged and `poster` equal to `/local-filesystem-lesson/basic-course/2-vowels/3-the-vowel-sound-uu/thumb.jpeg`

### Requirement: Generator validates that every emitted key resolves on disk

`scripts/generate-course-content-seed.ts` SHALL call `BlobStore.exists(key)` for every content key it emits (`VideoLesson.source`, `VideoLesson.poster`, and each `Resource.url` key). If any key does not resolve to a file under the content root, the generator SHALL exit non-zero with a message naming the offending key(s) and SHALL NOT write a partial `seed-content.ts`. This closes the slug↔disk drift that previously shipped silently.

An emitted `source` that is an absolute `http(s)` URL is not a content key and SHALL be excluded from this check — there is no file under the content root for it to resolve to, and checking it would fail every declared external source. Every other emitted key for the same lesson, its `poster` included, SHALL still be checked.

#### Scenario: All emitted keys resolve

- **WHEN** every folder and file under the content root has been normalized and the generator runs
- **THEN** every `exists(key)` returns `true`, and `seed-content.ts` is written

#### Scenario: An unresolved key fails the generation loudly

- **WHEN** the generator emits a key whose file is missing on disk (e.g., disk not yet normalized)
- **THEN** the generator exits non-zero, names the unresolved key, and does not overwrite the existing `seed-content.ts`

#### Scenario: A declared external source is not checked against disk

- **WHEN** a lesson's `source` is emitted as `https://www.youtube.com/embed/27WXXMFimvE` and the generator runs its validation pass
- **THEN** no `exists` call is made for that value, the lesson's `poster` key is still checked, and generation succeeds

### Requirement: Moving an asset updates its placement and its bytes together

The system SHALL provide `scripts/move-content.ts`, which for a given key or key
prefix and a target store: uploads the bytes to the target, verifies them with
`exists()` against the target store, rewrites `content-locations.json` to route
those keys there, and only then offers to delete the source objects.

The script SHALL NOT rewrite the manifest before the destination verifies, so an
interrupted move leaves the manifest pointing at bytes that are still present.

The system SHALL provide `pnpm verify:content`, which walks every content key in
`seed-content.ts` — every `source`, `poster`, `Resource.url` and notes key — and
calls `exists()` on the routed store, failing non-zero and naming every key that
does not resolve.

A lesson `source` that is an absolute `http(s)` URL is not a content key and
SHALL be excluded from that walk. It names no object any declared store holds,
so `verify:content` would demand a file that was never meant to exist and
`move-content.ts` would try to relocate something it does not own. The same
lesson's `poster`, resources and notes keys are still walked, so moving a
lesson's assets between stores keeps working for the lesson whose video left.

The single inventory both scripts read SHALL apply this exclusion once, rather
than each script filtering for itself — they must never check different sets.

#### Scenario: A completed move leaves manifest and buckets agreeing

- **WHEN** `move-content.ts` finishes for a prefix
- **THEN** the manifest routes that prefix to the target, every moved key
  resolves there, and `pnpm verify:content` passes

#### Scenario: A move that fails to upload does not rewrite the manifest

- **WHEN** the upload or its `exists()` verification fails partway
- **THEN** `content-locations.json` is unchanged and the source objects are not
  deleted

#### Scenario: A hand-edited manifest that lies is caught

- **WHEN** the manifest routes a prefix to a store whose bucket does not hold
  those objects
- **THEN** `pnpm verify:content` exits non-zero and names the unresolved keys

#### Scenario: An externally hosted lesson is not part of the store inventory

- **WHEN** the inventory is walked for a course whose lessons declare
  `lessonVideoSources`
- **THEN** no YouTube URL appears among the keys, every one of those lessons'
  posters and resources does, and `pnpm verify:content` exits zero
