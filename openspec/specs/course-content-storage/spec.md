# Capability: course-content-storage

## Purpose

Define how course content (videos, PDFs, thumbnails, supplementary markdown) is resolved to URLs at runtime, and how the catalog that drives the lesson/resource repositories is declared. The `BlobStore` abstraction decouples lesson/resource adapters from the underlying storage backend so the application can target a local filesystem in development and an S3-compatible bucket in production without changes to the domain or to the lesson/resource adapters.

This spec captures WHAT the storage layer must do. The domain entities and ports (`LessonRepository`, `ResourceRepository`, `BlobStore`) are defined in `openspec/specs/course-platform-domain/spec.md`; this spec is the storage-adapter counterpart.
## Requirements
### Requirement: BlobStore is the single point of URL resolution for course content

The system SHALL define a `BlobStore` interface under `src/adapters/persistence/blob-store/blob-store.ts` with three methods:

- `url(key: string): string` — returns the public URL for the given content key.
- `exists(key: string): Promise<boolean>` — returns whether a blob for the given key exists in the underlying store.
- `readText(key: string): Promise<string>` — reads a bounded UTF-8 text blob for a known text key.

A "content key" is an opaque, store-agnostic identifier such as `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`. The key MUST be URL-safe (kebab-case ASCII, no spaces, no `&`/`#`/`:`).

The `BlobStore` interface is a driven-adapter primitive. It MUST NOT live under `src/domain/ports/` and MUST NOT be imported by anything under `src/domain/**` (the `architecture-boundaries` spec continues to hold).

URL resolution SHALL happen exactly once, at read time, inside the lesson and resource adapters. No other layer — not the manifests, not the UI — SHALL concatenate a base URL onto a content key. A content key SHALL NOT appear in any value handed to the domain: the adapters resolve keys before constructing entities, so `VideoLesson.source`, `VideoLesson.poster` and `Resource.url` are always fully-formed URLs or site-relative paths by the time a domain schema parses them.

A seed value that is ALREADY an absolute `http(s)` URL is not a content key and SHALL bypass `BlobStore` entirely rather than being resolved through it. This is the one exception to single-point resolution, and it is what lets a lesson be served by a third party (a `lessonVideoSources` entry pointing at YouTube) while every other asset in the same lesson stays keyed. Passing such a value to `BlobStore.url()` would prepend the store's base and produce a nonsense URL, so the exception is a correctness requirement, not a convenience.

#### Scenario: A lesson adapter resolves a video URL via BlobStore

- **WHEN** `LocalFilesystemLessonRepository` builds a `VideoLesson.source` for a lesson whose video key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`
- **THEN** the resulting `source` value is exactly what `blobStore.url(key)` returns — no path concatenation in the adapter itself

#### Scenario: A resource adapter resolves a PDF URL via BlobStore

- **WHEN** `LocalFilesystemResourceRepository` builds a `Resource.url` for a PDF whose key is `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.pdf`
- **THEN** the resulting `url` value is exactly what `blobStore.url(key)` returns

#### Scenario: Swapping the BlobStore changes every content URL without touching the manifests

- **WHEN** the same lesson rows are used to build the adapters twice, once with a `BlobStore` whose `url(key)` returns `/local-filesystem-lesson/<key>` and once with one returning `https://cdn.example.com/<key>`
- **THEN** every `VideoLesson.source`, `VideoLesson.poster` and `Resource.url` read from the second set of adapters carries the `https://cdn.example.com/` prefix, and no manifest was edited

#### Scenario: An absolute URL in the seed bypasses the store

- **WHEN** a lesson row's `source` is `https://www.youtube.com/embed/yY7RWGUbqng` and the adapter reads it with a `BlobStore` whose `url(key)` returns `/local-filesystem-lesson/<key>`
- **THEN** the returned `VideoLesson.source` is exactly `https://www.youtube.com/embed/yY7RWGUbqng`, with no base URL prepended

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

### Requirement: A lesson's video source may be declared as an external URL

The manifest SHALL support declaring a lesson's `source` as an absolute `http(s)`
URL rather than a content key, for lessons whose video is served by someone else
— the Basic Course's lectures stream from YouTube.

A value that is neither an absolute `http(s)` URL nor a well-formed content key
SHALL be rejected.

A declared external source SHALL affect `source` only. `poster`,
`Resource.url` and lesson notes keep their content keys and their existing
resolution, so a lesson served from YouTube still carries a locally-stored
thumbnail and locally-stored resources.

A lesson whose `source` is an external URL SHALL NOT require a local video file
to exist. Its `durationSeconds` is declared in the manifest like every other
lesson's, so the local `.mp4` may be deleted without changing what the
application serves. This replaces the previous rule, under which the on-disk
`.mp4` remained the source of `durationSeconds` via `ffprobe` and therefore could
not be removed.

#### Scenario: A declared lesson serves its external URL

- **WHEN** the manifest declares lesson `2-vowels/1-the-vowel-sound-schwa` with
  `source` `https://www.youtube.com/embed/27WXXMFimvE`
- **THEN** that lesson is served with exactly that `source`, and its `poster` is
  still the content key resolved through `BlobStore`

#### Scenario: A lesson keeping a content key is unaffected

- **WHEN** a lesson declares a `source` that is a content key rather than a URL
- **THEN** the key resolves through `BlobStore` exactly as it does today

#### Scenario: Deleting a hosted lesson's local video changes nothing

- **WHEN** every `.mp4` under the Basic Course is deleted and the app is restarted
- **THEN** all 48 lessons still serve their YouTube `source`, their declared
  duration and their locally-stored poster

#### Scenario: A value that is neither a URL nor a valid key is rejected

- **WHEN** the manifest declares a `source` that is an empty string or a
  site-relative path such as `/videos/x.mp4`
- **THEN** validation fails with a message naming the offending lesson

### Requirement: Asset placement is declared in a runtime location manifest

The system SHALL read asset placement from a tracked JSON manifest,
`content-locations.json`, that declares which store answers for which content
key. It is read at runtime when the dependency graph is built, NOT at build
time, so moving an asset never touches the course manifests.

The manifest SHALL have the shape:

```jsonc
{
  "version": 1,
  "stores": {
    "local": { "driver": "local", "baseUrl": "/local-filesystem-lesson" },
    "s3-video": {
      "driver": "s3",
      "bucket": "lessons-video",
      "region": "us-east-1",
      "pathPrefix": "v1/",          // optional: where keys sit INSIDE the bucket
      "visibility": "signed",       // "public" | "signed"
      "publicUrl": "https://cdn.example.com/video"  // required when public
    },
    "gcs-docs": { "driver": "gcs", "bucket": "lessons-docs", "visibility": "signed" }
  },
  "default": "local",
  "routes": [
    { "prefix": "advanced-intermediate-course/8-everyday-english/", "store": "s3-video" }
  ],
  "overrides": {
    "advanced-intermediate-course/3-contractions/6-i-d/odd-one.mp4": "gcs-docs"
  },
  "assets": {
    // Per-asset declaration. The only layer that can change the object path.
    "advanced-intermediate-course/1-intro/1-welcome/video.mp4": {
      "store": "s3-video",
      "objectPath": "shared/welcome-2024.mp4"
    }
  }
}
```

A key SHALL be routed by, in order: an exact match in `assets`; otherwise an
exact match in `overrides`; otherwise the `routes` entry whose `prefix` is the
LONGEST match; otherwise `default`. The three layers exist because placement
comes in three shapes: a module migrates as a prefix, a stray file moves as one
key, and an asset whose real path does not follow its key needs that path
declared. Expressing any one through another is impractical for 319 keys.

The `assets` block SHALL be optional, and SHALL map a content key to
`{ store?, objectPath? }`, both optional. A declared `store` overrides routing
for that key; a declared `objectPath` replaces the key-derived object path
within the resolved store, `pathPrefix` included. An entry declaring neither is
a no-op and SHALL be rejected rather than silently ignored.

`assets` SHALL be the ONLY layer that can change the object path. `routes` and
`overrides` move a key between stores while it keeps its key-derived path,
because that is what a bulk migration does.

Absent an `assets` entry, a store's `pathPrefix` SHALL be prepended to the key to
form the object path inside that store. The content key SHALL NOT be redefined
by a move: the key is identity, the object path is placement, and conflating
them would break the guarantee that a move leaves the course manifests untouched.
That is exactly why an asset whose path diverges is declared here rather than by
rewriting its key.

Credentials SHALL NOT appear in the manifest. Bucket names, regions and CDN URLs
are not secrets and belong in the tracked file; access keys are read from the
environment by the drivers.

The manifest SHALL be validated with a Zod schema. A manifest that is malformed
JSON, fails the schema, names a store that `stores` does not declare, or declares
a public store with no `publicUrl` SHALL abort dependency-graph construction with
a message naming the offending entry. A present-but-invalid manifest SHALL NOT
fall back to defaults.

The manifest SHALL be optional. With no manifest on disk the system SHALL behave
as a single local store at `/local-filesystem-lesson`, which is the pre-change
behaviour.

#### Scenario: A module's videos are migrated with one route

- **WHEN** the operator adds a `routes` entry mapping the prefix
  `advanced-intermediate-course/8-everyday-english/` to the `s3-video` store
- **THEN** every key under that prefix resolves through `s3-video`, every other
  key is unaffected, and the course manifests are unchanged on disk

#### Scenario: A single asset is moved with one override

- **WHEN** the operator adds one `overrides` entry for a single key whose prefix
  routes elsewhere
- **THEN** that key alone resolves through the override's store, and its
  siblings under the same prefix keep their route

#### Scenario: The longest matching prefix wins

- **WHEN** `routes` holds both `advanced-intermediate-course/` → `local` and
  `advanced-intermediate-course/8-everyday-english/` → `s3-video`, and a key
  under the second prefix is resolved
- **THEN** it resolves through `s3-video`, not `local`

#### Scenario: A key matching no route falls to the default store

- **WHEN** a key matches no `overrides` entry and no `routes` prefix
- **THEN** it resolves through the store named by `default`

#### Scenario: The object path is the store's prefix plus the key

- **WHEN** the key `course/module/lesson/video.mp4` routes to a store whose
  `pathPrefix` is `v1/`
- **THEN** the object fetched from that store is `v1/course/module/lesson/video.mp4`,
  and the key recorded in the manifest is still `course/module/lesson/video.mp4`

#### Scenario: A route naming an undeclared store fails loudly at boot

- **WHEN** a `routes` entry or an `overrides` value names a store absent from
  `stores`
- **THEN** building the dependency graph throws, naming that entry, rather than
  silently falling back to `default`

#### Scenario: An absent manifest preserves today's behaviour

- **WHEN** the app boots with no `content-locations.json` on disk
- **THEN** every content URL is byte-identical to the pre-change output, all
  beginning with `/local-filesystem-lesson/`

#### Scenario: A declared asset overrides both its store and its object path

- **WHEN** the `assets` block maps a key to `{ store: "s3-video", objectPath: "shared/welcome-2024.mp4" }`
  and a `routes` prefix would otherwise send that key to `local`
- **THEN** the key resolves through `s3-video` at exactly `shared/welcome-2024.mp4`,
  with neither the key nor the store's `pathPrefix` contributing to the path

#### Scenario: A declared asset may redirect only the path

- **WHEN** an `assets` entry declares `objectPath` but no `store`
- **THEN** the key keeps the store its routes give it, and only its object path changes

#### Scenario: A declared asset may redirect only the store

- **WHEN** an `assets` entry declares `store` but no `objectPath`
- **THEN** the key resolves through that store at its normal key-derived path,
  `pathPrefix` included

#### Scenario: An asset entry outranks an override and a route

- **WHEN** the same key appears in `assets`, in `overrides`, and under a `routes` prefix
- **THEN** the `assets` entry decides, because it is the most specific declaration

#### Scenario: An empty asset entry is rejected rather than ignored

- **WHEN** an `assets` entry declares neither `store` nor `objectPath`
- **THEN** the manifest fails validation naming that key, because an entry that
  changes nothing is an authoring mistake, not a default

#### Scenario: An asset entry naming an undeclared store fails loudly

- **WHEN** an `assets` entry names a store absent from `stores`
- **THEN** the manifest fails validation naming that entry, as `routes` and
  `overrides` already do

### Requirement: Every asset's placement can be materialized into the manifest

The system SHALL provide `pnpm materialize:content-assets`, which writes every
content key in the course manifests into the location manifest's `assets` block with the
store and object path that key currently resolves to.

This exists so that an exhaustive manifest — every asset's placement written
down rather than inferred — is one command instead of 319 hand-typed entries.
Hand-typing them is the erratum risk the inference was avoiding; generating them
is not.

Materializing SHALL be idempotent: running it against an already-materialized
manifest that has not moved any asset SHALL leave the file byte-identical.

Materializing SHALL preserve entries whose `objectPath` diverges from the
key-derived one, because those record a decision the walk cannot rediscover.

The command SHALL be opt-in. An absent `assets` block stays absent unless it is
run, and the system's behaviour is identical either way.

#### Scenario: Every key is written down in one command

- **WHEN** `pnpm materialize:content-assets` runs against a manifest with no `assets` block
- **THEN** the manifest gains one `assets` entry per content key in the seed, each
  naming the store and object path that key already resolved to

#### Scenario: Materializing changes no URL

- **WHEN** the manifest is materialized and the app resolves every key before and after
- **THEN** every resolved URL is byte-identical, because the entries record what
  routing already produced

#### Scenario: Re-materializing an unchanged manifest is a no-op

- **WHEN** the command runs twice with no content or routing change in between
- **THEN** the second run leaves `content-locations.json` byte-identical

#### Scenario: A hand-declared divergent path survives materializing

- **WHEN** an `assets` entry declares an `objectPath` that the key would not
  produce, and the command runs
- **THEN** that entry keeps its declared `objectPath`

### Requirement: RoutingBlobStore resolves each key through the store it routes to

The system SHALL provide a `RoutingBlobStore` implementing the existing
`BlobStore` interface, constructed from the resolved location manifest, that
delegates `url(key)`, `exists(key)` and `readText(key)` to the driver the key
routes to.

`RoutingBlobStore` SHALL NOT change the `BlobStore` interface. In particular
`url(key)` SHALL remain **synchronous**, so no change propagates into the lesson,
resource or notes adapters, into entity construction, or into the domain.

The system SHALL provide `S3BlobStore` and `GcsBlobStore` drivers alongside
`LocalFilesystemBlobStore`, each applying the same key-safety rules the local
driver already enforces (no absolute keys, no `..` traversal, no decoding a
binary key as text).

`RoutingBlobStore` SHALL compose the object path from the key and the store's
`pathPrefix` before delegating, so that composition lives in one place rather
than being repeated — and diverging — across three drivers. A driver therefore
resolves a path within its own store and knows nothing about routing.

One `RoutingBlobStore` instance SHALL be shared by the lesson, resource and notes
adapters within a dependency-graph build, so the three can never disagree about
where content lives.

#### Scenario: Two keys in one page resolve through different stores

- **WHEN** a lesson's video routes to `s3-video` and its PDF resource routes to
  `local`
- **THEN** the rendered page carries a bucket-backed URL for the video and a
  site-relative URL for the PDF, from a single `BlobStore` instance

#### Scenario: Existence is checked against the routed store

- **WHEN** `exists(key)` is called for a key that routes to `s3-video`
- **THEN** the S3 driver is asked, the local filesystem is not consulted, and the
  answer reflects the object's presence in that bucket under its `pathPrefix`

#### Scenario: The interface is unchanged

- **WHEN** `RoutingBlobStore` is substituted for `LocalFilesystemBlobStore` in
  the dependency graph
- **THEN** no file under `src/domain/**`, and no lesson, resource or notes
  adapter, requires an edit

### Requirement: Private stores are served through a signing redirect endpoint

For every store whose `visibility` is `signed`, `url(key)` SHALL return a
site-relative URL to `GET /api/content/[...key]` rather than a bucket URL. That
route handler SHALL resolve the key through the same routing rules, mint a signed
URL from the owning driver, and answer **302** with that URL in `Location`.

The route handler SHALL NOT proxy bytes. Streaming a video through the Node
process would put the whole corpus through the app server and break range
requests; the redirect lets the browser fetch and seek directly against the
bucket.

Signed URLs SHALL be minted with a time-to-live long enough to outlast a viewing
session (default 6 hours), because a URL that expires mid-playback breaks seeking
rather than merely re-authenticating.

The handler SHALL reject a key that fails the same safety rules the drivers
enforce, and SHALL answer 404 for a key that resolves to no object.

#### Scenario: A private video is fetched through the redirect

- **WHEN** the browser requests the `source` URL of a lesson whose video routes
  to a `signed` store
- **THEN** `/api/content/...` answers 302 with a signed bucket URL, and the video
  bytes are served by the bucket, not by the Next.js server

#### Scenario: A public store is not routed through the endpoint

- **WHEN** a key routes to a store whose `visibility` is `public`
- **THEN** `url(key)` returns that store's `publicUrl`-based URL directly, with
  no `/api/content` hop

#### Scenario: An unsafe key is rejected before any bucket call

- **WHEN** `/api/content` is requested with a key containing `..` or an absolute
  prefix
- **THEN** it answers 400 and no request is made to any store

### Requirement: Moving an asset updates its placement and its bytes together

The system SHALL provide `scripts/move-content.ts`, which for a given key or key
prefix and a target store: uploads the bytes to the target, verifies them with
`exists()` against the target store, rewrites `content-locations.json` to route
those keys there, and only then offers to delete the source objects.

The script SHALL NOT rewrite the manifest before the destination verifies, so an
interrupted move leaves the manifest pointing at bytes that are still present.

The system SHALL provide `pnpm verify:content`, which walks every content key in
the course manifests — every `source`, `poster`, `Resource.url` and notes key — and
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

### Requirement: Lesson notes read from a remote store are cached

The system SHALL cache the Markdown returned by `BlobStore.readText` when the
notes key routes to a non-local store, so repeated views of a lesson do not
re-fetch it.

`LessonNotesRepository.byLesson` calls `readText` for that lesson's `readme.md`.
Against the local driver this is a disk read; against a bucket it is a network
round trip on every lesson view. Notes content changes only when the seed is
regenerated, so the cache MAY be held for the process lifetime.

#### Scenario: A second view of the same lesson does not re-fetch its notes

- **WHEN** the same lesson's notes are requested twice from a store whose driver
  is `s3` or `gcs`
- **THEN** the driver performs one object read, and the second call is served
  from cache

### Requirement: Lesson-vs-Resource discrimination uses file presence, not folder name

The manifest sync command SHALL classify each lesson folder as follows:

- If the folder contains an `.mp4` file, the lesson is `kind: "video"` with `source` set to the video's content KEY.
- If the folder contains a `readme.md` AND no `.mp4`, the lesson is `kind: "reading"` with `body` set to the file's contents.
- If the folder contains BOTH an `.mp4` and a `readme.md`, the lesson is `kind: "video"` and the `readme.md` becomes its `notesKey` and a resource entry `{ kind: "other", title: "<lesson-title> notes", url: <readme-key> }`.
- Any other file (PDF, DOCX, image) in a lesson folder becomes a resource entry whose `kind` is derived from the file extension: `.pdf` → `"pdf"`, `.pptx`/`.key` → `"slides"`, anything else → `"other"`.
- The first `.jpeg`/`.jpg`/`.png` in a video lesson folder becomes the entry's `poster` KEY. Subsequent images are ignored for poster purposes (they are not surfaced in v1).

These rules SHALL apply only to lessons the manifests do not already describe.
They PROPOSE an entry; they never decide what the application serves, and they
never revise a declaration. A lesson whose folder no longer matches its
declaration keeps the declaration.

#### Scenario: A video lesson with a PDF and a thumbnail

- **WHEN** an undescribed lesson folder contains `video.mp4`, `thumbnail.jpeg`, and `handout.pdf`
- **THEN** the sync command appends a video lesson entry with `source` set to the video key and `poster` set to the thumbnail key, AND a resource entry `{ kind: "pdf", title: "handout", url: <pdf-key> }`

#### Scenario: A reading-only lesson with a readme and a docx

- **WHEN** an undescribed lesson folder contains `notes.md` (no video) and `exercise.docx`
- **THEN** the sync command appends a reading lesson entry with `body` set to the markdown contents, AND a resource entry `{ kind: "other", title: "exercise", url: <docx-key> }`

#### Scenario: A bimodal lesson (video + readme) collapses the readme into a resource

- **WHEN** an undescribed lesson folder contains both `lesson.mp4` and `notes.md`
- **THEN** the sync command appends a video lesson entry (NOT a new bimodal kind) AND a resource entry `{ kind: "other", title: "<lesson-title> notes", url: <notes-key> }`

#### Scenario: An already-declared lesson is not reclassified

- **WHEN** a lesson the manifests declare as `video` with a YouTube `source` has no
  `.mp4` on disk at all
- **THEN** the sync command leaves it untouched, because classification applies only
  to folders no declaration covers

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

### Requirement: The BlobStore driver is selected by configuration

`use-case-dependencies.ts` SHALL build the `BlobStore` from the location manifest
rather than from a single URL prefix:

- `content-locations.json` declares every store, the default, the routes and the
  overrides. It is the source of truth for WHERE content lives.
- `CONTENT_LOCAL_ROOT` remains an environment variable and sets the absolute
  filesystem path the local driver reads from. When unset it SHALL default to
  `public/local-filesystem-lesson` resolved against the process working
  directory. It stays in the environment because it is a machine-specific path,
  not a placement decision.
- Cloud credentials SHALL come from the environment, never from the manifest.

`CONTENT_BASE_URL` is removed; the public URL prefix is now the `baseUrl` (local)
or `publicUrl` (remote) of a store in the manifest.

The same `BlobStore` instance SHALL be shared by the lesson, resource and notes
adapters within one dependency-graph build, so the three can never disagree about
where content lives.

Repointing content storage SHALL NOT require editing the course manifests.

#### Scenario: Default boot preserves today's URLs

- **WHEN** the app boots with `USE_COURSE_CONTENT_SEED=1`, no location manifest,
  and `CONTENT_LOCAL_ROOT` unset
- **THEN** every rendered video, poster and resource URL is byte-identical to the
  pre-change output, all beginning with `/local-filesystem-lesson/`

#### Scenario: A CDN prefix is applied by manifest alone

- **WHEN** the manifest declares one public store with
  `publicUrl: "https://cdn.example.com/course-content"` as the default
- **THEN** every rendered video, poster and resource URL begins with
  `https://cdn.example.com/course-content/`, and the course manifests are unchanged
  on disk

### Requirement: The notes adapter matches its resource by key, not by resolved URL

`LocalFilesystemLessonNotesRepository` SHALL locate a lesson's notes `Resource` by comparing content KEYS, not by reconstructing a URL with `BlobStore.url(key)` and string-matching it against `Resource.url`.

Matching on the resolved URL couples the notes adapter to the resource adapter having used an identically-configured `BlobStore`; when the two disagree the lookup returns `null` and notes silently disappear with no error. Key comparison removes that failure mode.

#### Scenario: Notes are found under a non-default base URL

- **WHEN** the app boots with `CONTENT_BASE_URL` set to something other than the default and a lesson with notes is opened
- **THEN** the notes markdown renders, because the lookup compared keys rather than base-URL-dependent strings

#### Scenario: A lesson with no notes still returns null

- **WHEN** `byLesson` is called for a lesson that has no entry in the notes key map
- **THEN** the adapter returns `null` without consulting the `BlobStore`

### Requirement: The image allowlist is derived from every public store

`next.config.ts` SHALL derive one `images.remotePatterns` entry per PUBLIC store
declared in `content-locations.json`, so placing posters in a bucket does not
additionally require editing the Next.js config by hand. Course posters are
rendered through `next/image`, which rejects any remote host absent from that
list.

Stores whose `visibility` is `signed` SHALL contribute no pattern: their URLs are
site-relative `/api/content/...` paths served from the app's own origin.

When no manifest exists, or every store is local or signed, the config SHALL
produce NO remote pattern — images are served from the app's own origin exactly
as before.

Each derived pattern SHALL be scoped to that store's `publicUrl` path prefix
rather than the whole host, so adding one bucket does not implicitly allowlist
every image on that domain.

The config is evaluated once at load. Editing the manifest in a running dev
server repoints URLs but not this allowlist; the server must be restarted.

#### Scenario: A public bucket's posters render instead of erroring

- **WHEN** the manifest declares a public store with
  `publicUrl: "https://cdn.example.com/course-content"` and a page containing a
  `next/image` poster routed there is requested
- **THEN** the page renders and the poster is served through Next's image
  optimizer, rather than failing with "Invalid src prop … hostname is not
  configured"

#### Scenario: Two public stores each contribute a pattern

- **WHEN** the manifest declares two public stores on different hosts
- **THEN** `images.remotePatterns` holds one entry per host, each scoped to that
  store's path prefix

#### Scenario: A signed store adds no remote pattern

- **WHEN** every remote store in the manifest has `visibility: "signed"`
- **THEN** `images.remotePatterns` is empty, because those posters are fetched
  from the app's own origin through `/api/content`

#### Scenario: No manifest adds no remote pattern

- **WHEN** no `content-locations.json` exists
- **THEN** `images.remotePatterns` is empty and image handling is unchanged from
  before this capability existed

### Requirement: On-disk content layout is normalized to match slug keys

The system SHALL provide a build-time normalization step that renames every folder AND every media/resource file under `public/local-filesystem-lesson/` to its kebab-case slug form, using the SAME slug resolution as the manifest sync command (`scripts/slug.ts` automatic normalization, with any explicit override the caller passes). After normalization, the physical path of each asset (relative to the content root) SHALL be byte-for-byte equal to the content key the manifests declare, so `blobStore.url(key)` resolves against Next.js `/public`.

The normalization step SHALL NOT rename `rename-manifest.json`; it is tooling state living at the content root, not content.

Normalization SHALL be idempotent (`slugify(slugify(x)) === slugify(x)`), so re-running it against an already-normalized tree makes no changes. If two distinct raw names within the same parent directory normalize to the same slug, the step SHALL abort with a non-zero status and name the colliding entries, without performing a partial rename of that directory.

#### Scenario: A folder with spaces, capitals, and special characters is renamed

- **WHEN** normalization encounters the folder `"8 Everyday English Phrases PART 2 Master Them!"`
- **THEN** it is renamed on disk to `"8-everyday-english-phrases-part-2-master-them"`

#### Scenario: A media file basename with spaces and accents is renamed

- **WHEN** normalization encounters the file `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** it is renamed on disk to `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"` (extension preserved, stem slugified)

#### Scenario: Tooling state at the content root is never renamed

- **WHEN** normalization runs against a content root holding `rename-manifest.json`
- **THEN** it keeps its exact filename and does not appear in the rename manifest's entries

#### Scenario: Re-running normalization on an already-normalized tree is a no-op

- **WHEN** normalization runs a second time against a tree whose every entry is already its slug
- **THEN** no rename occurs and the step exits zero

#### Scenario: A slug collision aborts without partial renames

- **WHEN** two sibling folders `"Intro"` and `"intro!"` both normalize to `"intro"`
- **THEN** the step exits non-zero, reports both colliding raw names, and leaves that directory unchanged

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

This requirement binds **every course declared in `src/content/<slug>.json`**, not the course
that happened to be imported first. A course whose lesson bodies predate the requirement is
non-conformant content, not an accepted exception: importing a course means bringing its notes
into this shape.

The two language sections of a bilingual lesson SHALL be mirrors of one another — the same
sub-headings, the same lists, the same examples, the same claims. A learner reading the
Spanish column and a learner reading the English column SHALL receive the same lesson, so
neither column is a reduced version of the other.

#### Scenario: A bilingual lesson body is structured by language

- **WHEN** a lesson's `readme.md` presents the same lesson in Spanish and in English
- **THEN** the body carries a `## Español` section and a `## English` section, each holding that language's sub-headings, paragraphs and lists

#### Scenario: A monolingual lesson body still names its language

- **WHEN** a lesson's `readme.md` presents content in English only
- **THEN** the body carries a single `## English` section rather than bare paragraphs under the title

#### Scenario: Reformatting a notes body leaves the title heading untouched

- **WHEN** a lesson's `readme.md` body is restructured into language sections
- **THEN** the file's first `#` heading is unchanged byte-for-byte, so the title the sync command would propose for a new lesson is unaffected

#### Scenario: Every declared course's lessons carry language sections

- **WHEN** the lesson `readme.md` files of every course declared in `src/content/` are inspected
- **THEN** each one that has a body carries at least one level-2 language section heading, with no course exempt

#### Scenario: The two columns carry the same lesson

- **WHEN** a bilingual lesson's Spanish and English sections are compared
- **THEN** they present the same sub-headings, the same example words and the same guidance, so neither language is shorter or poorer than the other

### Requirement: A lesson notes body describes the lesson, not just names it

A lesson `readme.md` SHALL NOT consist of a `#` title alone. Inside each language section,
the body SHALL open with a `###` descriptive sub-heading and SHALL carry, at minimum, prose
that orients the learner in what the lesson covers and why it matters to their pronunciation.

Where the lesson teaches a specific sound, the body SHALL additionally carry concrete example
words in which that sound occurs, so the learner has something to hear for and repeat rather
than a description in the abstract.

Notes bodies SHALL be written for the learner, in the second person, and SHALL stay within
what the lesson itself teaches — a notes body SHALL NOT introduce material the lesson does not
cover.

#### Scenario: A title-only notes file is completed

- **WHEN** a lesson's `readme.md` contains only its `#` title heading
- **THEN** it is treated as an incomplete notes body and given language sections with descriptive content, rather than shipped as-is

#### Scenario: A sound lesson names the words the sound lives in

- **WHEN** a lesson teaches a specific vowel or consonant sound
- **THEN** its notes body lists concrete English words containing that sound

#### Scenario: Notes stay inside the lesson's own subject

- **WHEN** a notes body is written or enriched for an existing lesson
- **THEN** it elaborates only on what that lesson teaches and introduces no new claims the lesson does not make

### Requirement: A course tree has one canonical on-disk shape

Every declared course SHALL present the same shape under the content root, so the
sync command walks one layout and only one:

```
<content-root>/<course-folder>/<module-folder>/<lesson-folder>/
    <video>.mp4            — optional; its presence makes the lesson a video lesson
    <poster>.jpeg          — optional; the first image becomes the poster
    readme.md              — optional; the lesson's notes, opening with a `#` heading
    <resource>.pdf         — zero or more; resources sit beside the media, never below it
```

Exactly three folder levels separate the content root from a lesson's files. A module
folder SHALL contain lesson folders and nothing else that the walk depends on; a lesson
folder SHALL hold its media, poster, notes and resources as **direct children**, with no
intervening subfolder. Notes SHALL be named `readme.md`, and a lesson whose title cannot
be recovered from its slug SHALL carry that title as the first `#` heading of that file.

Course content that arrives in a different shape — an extra grouping level, a lesson's
files loose at module level, notes under another filename, resources in a subfolder —
SHALL be migrated to this shape before the course is declared in `src/content/<slug>.json`.
The sync command SHALL NOT be taught to recognize alternative shapes, and the manifests SHALL
NOT gain fields describing them: one contract keeps every course's content keys derivable
from its path, and a second shape would double the surface every future content change is
verified against.

#### Scenario: A grouping level between module and lesson is flattened, not accommodated

- **WHEN** an imported course nests lesson folders under `<module>/<group>/<lesson>/`
- **THEN** each `<group>` is promoted to a sibling module of `<module>` before the course
  is declared, and the sync command's walk is unchanged

#### Scenario: A lesson's files loose at module level are wrapped in a lesson folder

- **WHEN** an imported module folder holds `lesson.mp4` and `thumbnail.jpeg` as direct
  children, with no lesson folder around them
- **THEN** those files are moved into a lesson folder inside that module before the course
  is declared, so the module holds lesson folders only

#### Scenario: Resources in a subfolder are hoisted beside the media

- **WHEN** an imported lesson folder holds its PDFs under `<lesson>/resources/`
- **THEN** those files are moved into `<lesson>/` before the course is declared, and the
  sync command proposes one resource entry per file exactly as it does for any other course

#### Scenario: Notes under another filename are renamed

- **WHEN** an imported lesson carries its notes as `description.md`
- **THEN** the file is renamed `readme.md` before the course is declared, so the notes are
  emitted as inline notes and a notes Resource rather than as an unnamed `other` resource

### Requirement: Reshaping an imported course tree is a dry-runnable, plan-driven step

The system SHALL provide `scripts/reshape-course-tree.ts`, a build-time step that brings
one imported course folder to the canonical shape defined above. It SHALL:

- Take a declarative plan naming the course folder and the moves it needs — module
  promotions with their new ladder positions, lesson folders to create around loose files,
  subfolders to hoist, and the notes filename to adopt. A course with no plan SHALL be left
  untouched, so running the step can never disturb a course that is already canonical.
- Default to a **dry run** that prints the `old → new` plan and mutates nothing. Renames
  SHALL happen only under `--apply`, mirroring `normalize-content-disk.ts`.
- Move files with `rename`, never copy, so a multi-gigabyte tree is reshaped without
  duplicating a byte.
- Be **idempotent**: re-running it against an already-reshaped tree SHALL make no changes
  and exit zero.
- Abort with a non-zero status, before mutating anything in the affected directory, when a
  move would overwrite an existing entry or when two sources would land on one target.

Reshaping SHALL run BEFORE `normalize-content-disk.ts`: the reshape decides where a folder
lives, normalization decides what it is called. Running them in the other order would
rename folders the plan still refers to by their raw names.

#### Scenario: A dry run mutates nothing

- **WHEN** the step runs without `--apply`
- **THEN** it prints every move it would make and no file or folder on disk has changed

#### Scenario: Re-running after a completed reshape is a no-op

- **WHEN** the step runs a second time with `--apply` against a tree it has already reshaped
- **THEN** it reports nothing to move and exits zero

#### Scenario: A colliding move aborts before touching the directory

- **WHEN** a planned move would land on a path that already exists
- **THEN** the step exits non-zero naming both paths, and no move in that directory is performed

#### Scenario: An undeclared course folder is not reshaped

- **WHEN** the step runs with a plan naming one course folder, and the content root holds others
- **THEN** only the named folder is touched

### Requirement: The course catalog is declared in tracked per-course manifests

The system SHALL read the complete course catalog from one manifest per course at
`src/content/<course-slug>.json`, enumerated by an index module at
`src/content/courses.ts`. Together these manifests are the single source of truth
for the catalog: every course, module, lesson and resource the application serves
is declared there. Nothing about the catalog SHALL be inferred from the content
tree at build or run time.

One course SHALL be one file. A course's manifest SHALL be editable without
touching any other course's, so that the file is both the unit of editing and the
unit of merge conflict.

The manifests SHALL live outside `public/`, so they are neither served at a public
URL nor dependent on the multi-gigabyte content tree being present on the machine.

The manifests SHALL live under `src/`, where the project's existing `@/*` path
alias already resolves them. No new path alias SHALL be introduced: the alias is
declared independently in `tsconfig.json` and `vitest.config.ts`, and a second one
would be two places to keep in sync for no gain.

The manifests SHALL be tracked by git. A fresh clone SHALL obtain a working
catalog from the repository alone, without the content bytes.

A manifest SHALL declare, for every lesson, the fields the domain's `Lesson`
requires and that were previously derived from the filesystem: `id`, `slug`,
`title`, `kind`, `sequence`, `source`, `durationSeconds`, and `poster` when one
exists. It SHALL likewise declare every resource with its `id`, `lessonId`,
`title`, `url` and `kind`.

A lesson's `source` and `poster`, and a resource's `url`, SHALL each be either a
content key resolved through `BlobStore` or an absolute `http(s)` URL used
verbatim. Which one it is SHALL be decided by the value's own shape, exactly as
it is today.

Every manifest SHALL be validated against a Zod schema. A manifest that is
malformed JSON or fails the schema SHALL fail loudly rather than fall back to any
default. Because `slug` and `sequence` must be unique across the whole ladder,
that check SHALL run over the full set after each file is parsed. There SHALL NOT
be a no-manifest fallback: the manifests are required, and an absent one is an
error.

#### Scenario: A fresh clone serves the catalog without the content tree

- **WHEN** a developer clones the repository, installs dependencies, and starts
  the app without ever obtaining the content root
- **THEN** the catalog renders every course, module and lesson declared under
  `src/content/`, and only the locally-stored assets 404

#### Scenario: The manifests are tracked by git

- **WHEN** a developer clones the repository and runs `git ls-files src/content/`
- **THEN** one `.json` manifest per course is listed, alongside the index module

#### Scenario: The manifests are not served publicly

- **WHEN** the app is running and a client requests
  `/local-filesystem-lesson/courses.manifest.json` or `/content/basic-course.json`
- **THEN** the request 404s, because the manifests live outside `public/`

#### Scenario: One course is edited without touching another

- **WHEN** a developer changes a lesson title in `src/content/basic-course.json`
- **THEN** `src/content/advanced-intermediate-course.json` is byte-identical, and
  the change touches exactly one manifest file

#### Scenario: A lesson declares its own duration

- **WHEN** a manifest declares a lesson with `durationSeconds: 663` and no
  `.mp4` exists anywhere under the content root for that lesson
- **THEN** the lesson is served as a video lesson reporting 663 seconds, and no
  filesystem access is attempted to determine its duration

#### Scenario: A missing manifest is an error, not a default

- **WHEN** a manifest named by `src/content/courses.ts` is absent or is not valid
  JSON
- **THEN** the failure is surfaced with a message identifying the problem, and
  the application does NOT fall back to a derived or empty catalog

#### Scenario: Two courses claiming the same ladder position fail loudly

- **WHEN** two manifests declare the same `sequence`, or the same `slug`
- **THEN** validation fails and names both files

### Requirement: The application reads the catalog without a code-generation step

The adapters SHALL consume the manifests directly. The repository SHALL NOT
contain a generated TypeScript catalog, and there SHALL NOT be a command whose
job is to turn content into application code.

The manifests SHALL be consumed by static import, so their data is resolved at
build time and lands in the server bundle. Reading the catalog SHALL NOT touch
the filesystem at run time and SHALL NOT cost anything per request. The catalog
SHALL NOT be shipped to the client: the pages that read it are Server
Components, which send only the lesson they rendered.

Adding a course SHALL mean adding its manifest and one import line to
`src/content/courses.ts`. Static import cannot enumerate a directory, so the index
is explicit by necessity; it SHALL contain nothing but those imports and the
exported list.

The rows handed to `resolveLessonRow` and `resolveResourceRow` SHALL keep their
current shape, so `BlobStore` remains the single point of URL resolution and the
adapters below it are unchanged.

#### Scenario: No generated catalog remains in the repository

- **WHEN** a developer searches the repository for a generated seed module or a
  `generate:content-seed` script
- **THEN** neither exists, and no source file imports a generated catalog

#### Scenario: Serving a lesson touches no filesystem for catalog data

- **WHEN** a lesson page renders
- **THEN** the lesson's identity, title, source, duration and poster come from
  the imported manifest, and the only filesystem access is for the asset bytes
  themselves

#### Scenario: Editing a manifest changes the catalog

- **WHEN** a developer edits a lesson's `title` in `src/content/basic-course.json`
  and reloads the app
- **THEN** the new title renders, with no generation command run in between

### Requirement: A maintenance command appends undescribed lessons without overwriting declarations

The system SHALL provide a command that scans the content tree and appends to a
course's manifest only those lessons and resources it does not already describe.
It exists so that adding a lesson does not require hand-writing a UUIDv5.

The command SHALL NOT overwrite, reorder or remove any existing manifest entry,
in any course's file. A hand-edited title, source or duration SHALL survive every
subsequent run. The manifest, not the command's output, is the source of truth.

The command SHALL derive a new lesson's `id` with the same UUIDv5 scheme used
today, so an entry it appends is indistinguishable from one migrated from the
previous generator.

When a lesson folder holds no video file, the command SHALL append the lesson
with a `durationSeconds` of `null` and report it, rather than guessing a
duration or skipping the lesson silently.

#### Scenario: A new lesson folder is appended

- **WHEN** a developer drops a new lesson folder into a declared module and runs
  the maintenance command
- **THEN** the manifest gains an entry for that lesson with its derived id, slug,
  title, source key and duration, and every pre-existing entry is byte-identical

#### Scenario: A hand-edited entry survives the command

- **WHEN** a developer overrides a lesson's `title` and `source` by hand, then
  runs the maintenance command
- **THEN** both edited values are still present and unchanged afterwards

#### Scenario: A lesson with no local video is reported, not guessed

- **WHEN** the command encounters a lesson folder with a `readme.md` but no video
  file
- **THEN** it appends the lesson with `durationSeconds: null` and reports it as
  needing a declared duration

### Requirement: Lesson identity is preserved across the migration

Lesson and resource ids SHALL be migrated into the manifest byte-for-byte from
the catalog they replace.

Saved progress and playback positions are keyed by lesson id in
`browser-local-storage`. A changed id silently discards a learner's history, so
the migration SHALL be verified id-by-id against the previous catalog before that
catalog is deleted.

#### Scenario: Every migrated id matches the previous catalog

- **WHEN** the migrated manifest is compared against the catalog it replaces
- **THEN** the set of course, module, lesson and resource ids is identical, with
  no additions, removals or changes

#### Scenario: A learner's progress survives the migration

- **WHEN** a learner who had completed lessons and saved playback positions loads
  the app after the migration
- **THEN** the same lessons read as complete and the same positions resume

### Requirement: Video bytes are never tracked by git

The repository SHALL refuse to track video files under the content root,
whichever course they belong to. This SHALL hold independently of which parts of
the content tree are tracked, so that un-ignoring a course's text assets cannot
pull gigabytes of video into the repository.

The Basic Course's non-video assets — lesson notes, posters and PDFs — SHALL be
tracked, because they are the part of its content tree that cannot be
regenerated and are small enough to version.

#### Scenario: A video file under a tracked course is still ignored

- **WHEN** a `.mp4` sits inside the Basic Course's tracked content folder and a
  developer runs `git status`
- **THEN** the video is not listed as addable content

#### Scenario: The Basic Course's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** the Basic Course's `readme.md`, `thumbnail.jpeg` and PDF files are
  present, and its video files are not

### Requirement: Declared assets are checked against the catalog

`pnpm verify:content` SHALL additionally report every `assets` entry whose key is
absent from the course manifests, and SHALL exit non-zero when there is one.

An exhaustive `assets` block goes stale the moment content is renamed or removed
and the manifests are edited. Without this check the location manifest would
accumulate entries for keys nothing asks for any more, and a reader could no
longer tell which placements are real.

#### Scenario: A stale asset entry is named

- **WHEN** the location manifest declares an `assets` entry for a key the course
  manifests no longer contain
- **THEN** `pnpm verify:content` exits non-zero and names that key as stale

#### Scenario: A location manifest matching the catalog passes

- **WHEN** every `assets` entry names a key the course manifests contain, and every
  key resolves
- **THEN** `pnpm verify:content` exits zero

### Requirement: The declared catalog is the whole catalog

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL
build the catalog from the course manifests alone. There SHALL be no hand-written course
seed and no configuration that selects between catalog sources: the courses the manifests
declare are the courses the application serves.

A course MAY withhold itself from being served by declaring `draft: true` in its own
manifest, in which case it is excluded when the environment hides drafts — see the
`draft-course-visibility` capability. That is a visibility filter over the one source, not
a second source: there is still exactly one place courses are declared, the filter reads
only the manifests' own `draft` field, and no configuration can introduce a course the
manifests do not declare. A course that declares no `draft` field is served in every
environment.

The lesson and resource ports SHALL bind directly to `LocalFilesystemLessonRepository` and
`LocalFilesystemResourceRepository`. No composite adapter SHALL sit between a port and its
single source — an indirection that fans one read out over one delegate hides the wiring
without buying anything back. Should a second content source return, the composite is a
change to make then, not machinery to keep unused now.

Catalog order SHALL come from `Course.sequence`, which each course declares in its own
manifest. The ladder therefore has exactly as many rungs as there are manifests it serves,
and moving a course between rungs is a one-line manifest edit. Withholding a draft course
SHALL leave the remaining courses in ascending `sequence` order with no renumbering: the
ladder's ordinals come from the data, so a gap in `sequence` values is not a gap in the
rendered ladder.

Booting without the content root SHALL fail visibly through the assets it cannot serve,
never by silently substituting different courses. A developer who has not obtained the
content sees the declared courses with unresolvable media, which names the real problem.
Lessons whose `source` is an external URL play regardless, because they need nothing from
the content root.

#### Scenario: The catalog holds exactly the declared courses

- **WHEN** the app boots with drafts shown, as it does in development
- **THEN** it serves exactly the courses the manifests under `src/content/` declare, in
  `sequence` order, with no placeholder or fallback course

#### Scenario: A draft course is withheld without a second source appearing

- **WHEN** the app boots with drafts hidden and one manifest declares `draft: true`
- **THEN** it serves exactly the remaining declared courses, in `sequence` order, and no
  course is served that the manifests do not declare

#### Scenario: A clone without the content root still serves the catalog

- **WHEN** a developer clones the repository and starts the app without the content root
- **THEN** every served course, module and lesson renders, locally-stored assets 404, and
  lessons served by an external URL still play

### Requirement: A video lesson may declare when it was published

A video lesson in a course manifest MAY declare an `uploadDate`. When present it SHALL be a calendar date, and it SHALL be carried through to the served lesson so delivery adapters can describe the video to search engines.

The field is optional by design. Making it required would force a date onto every existing lesson before anything could ship; leaving it out entirely would make correct `VideoObject` structured data impossible. Optional lets the catalog be dated lesson by lesson, and a lesson without a date is simply not described as a video.

#### Scenario: A manifest may omit the date
- **WHEN** a video lesson declares no `uploadDate`
- **THEN** the manifest is valid and the lesson is served as it always was

#### Scenario: A malformed date is refused loudly
- **WHEN** a video lesson declares an `uploadDate` that is not a calendar date
- **THEN** the manifest fails validation with a message naming the offending lesson

