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

### Requirement: Course metadata is declared in an untracked content manifest

The system SHALL read course declarations from a manifest at
`public/local-filesystem-lesson/courses.manifest.json`. The manifest is the single
place where everything that cannot be inferred from the content tree is declared.

The manifest SHALL be a JSON document of the shape:

```jsonc
{
  "version": 1,
  "courses": [
    {
      "folder": "advanced-intermediate-course",  // required: directory under the content root
      "slug": "advanced-intermediate-course",    // optional: defaults to slugify(folder)
      "title": "Advanced Intermediate Course",   // optional: defaults to humanize(slug)
      "description": "…",                        // optional: defaults to the generated sentence
      "language": "en",                          // optional: defaults to "en"
      "sequence": 2,                             // required: position in the home ladder
      "slugOverrides": { "1 Day#1": "1-day-01" },
      "titleFromNotesModules": ["3-contractions-reductions"],
      "lessonTitleOverrides": { "3-contractions-reductions/6-i-d": "I’d …" }
    }
  ]
}
```

`slugOverrides` is keyed by the RAW on-disk name; `titleFromNotesModules` lists
module slugs; `lessonTitleOverrides` is keyed by `moduleSlug/lessonSlug` relative
to the course, because scoping each override map inside its course entry makes a
cross-course key collision unrepresentable.

The manifest SHALL be untracked by git. `public/local-filesystem-lesson/` is
already ignored in full, so no new `.gitignore` rule is required; a comment SHALL
be added there recording that the manifest is deliberately covered by it. The
manifest describes ~15 GB of untracked content and is only meaningful on a machine
that has it, so the two are present and absent together.

The manifest SHALL be optional. When the file is absent, the generator SHALL behave
exactly as it did before this change: one course, taken from the first folder under
the content root, with a slug-derived title, a generated description, `language:
"en"`, and `sequence: 2`.

The manifest SHALL be validated with a Zod schema before use. A manifest that is
malformed JSON, fails the schema, names a `folder` that does not exist under the
content root, or declares two courses with the same `slug` or the same `sequence`
SHALL abort generation with a non-zero exit status and a message naming the
offending entry, WITHOUT writing a partial `seed-content.ts`. A malformed manifest
SHALL NOT silently fall back to the no-manifest defaults — a present-but-wrong
manifest is an error, an absent one is a default.

#### Scenario: A new course is added without touching any code

- **WHEN** a developer drops a new course folder under the content root, adds an
  entry naming that folder with a `sequence` of `3` to `courses.manifest.json`,
  and runs `pnpm generate:content-seed`
- **THEN** `seed-content.ts` contains that course, its modules, lessons and
  resources, and no file under `scripts/` was edited

#### Scenario: An absent manifest reproduces the pre-change output

- **WHEN** the generator runs against a content root with no `courses.manifest.json`
- **THEN** it emits exactly one course, from the first folder, with the slug-derived
  title, the generated description, `language: "en"` and `sequence: 2`

#### Scenario: Declared metadata overrides every derived default

- **WHEN** a course entry declares `title`, `description`, `language` and `sequence`
- **THEN** the emitted `Course` carries those four values verbatim, not the derived ones

#### Scenario: A manifest naming a missing folder fails loudly

- **WHEN** a course entry names `folder: "does-not-exist"`
- **THEN** the generator exits non-zero, names that folder, and leaves the existing
  `seed-content.ts` untouched

#### Scenario: Malformed JSON is an error, not a fallback

- **WHEN** `courses.manifest.json` exists but is not valid JSON, or omits a required
  field such as `sequence`
- **THEN** the generator exits non-zero with a message identifying the problem and
  does NOT fall back to the no-manifest defaults

#### Scenario: Two courses claiming the same ladder position fail loudly

- **WHEN** two course entries declare the same `sequence`, or the same `slug`
- **THEN** the generator exits non-zero and names both entries

#### Scenario: The manifest is not tracked by git

- **WHEN** a developer creates `public/local-filesystem-lesson/courses.manifest.json`
  and runs `git status`
- **THEN** the file is not listed as untracked-and-addable content, because the
  content root is already ignored in full

### Requirement: A tracked example manifest is the template and the reviewed record

The repository SHALL commit `scripts/courses.manifest.example.json`: a complete,
schema-valid manifest carrying the real current values for the shipped course,
including every slug override, notes-heading module and lesson-title override that
`scripts/slug-overrides.ts`, `scripts/title-from-notes-modules.ts` and
`scripts/title-overrides.ts` held before this change.

The example SHALL be a working manifest, not a stub: copying it to
`public/local-filesystem-lesson/courses.manifest.json` on a machine that has the
content SHALL regenerate the committed `seed-content.ts` byte-for-byte.

A test SHALL assert that the example file parses against the manifest schema, so
the committed template cannot drift out of shape.

This mirrors the repository's existing `.env` / `.env.example` split: the live file
carries machine-local truth and stays untracked, the example is the one artifact a
fresh clone needs in order to know what the live file must contain.

#### Scenario: A fresh clone learns the manifest's shape

- **WHEN** a developer clones the repo, obtains the content root out of band, and
  copies `scripts/courses.manifest.example.json` to
  `public/local-filesystem-lesson/courses.manifest.json`
- **THEN** `pnpm generate:content-seed` succeeds and produces no diff against the
  committed `seed-content.ts`

#### Scenario: The example manifest is schema-checked in CI

- **WHEN** `pnpm test:run` executes
- **THEN** a test parses `scripts/courses.manifest.example.json` with the manifest
  schema and fails if it no longer validates

### Requirement: Asset placement is declared in a runtime location manifest

The system SHALL read asset placement from a tracked JSON manifest,
`content-locations.json`, that declares which store answers for which content
key. It is read at runtime when the dependency graph is built, NOT at build
time, so moving an asset never regenerates `seed-content.ts`.

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
them would break the guarantee that a move leaves `seed-content.ts` untouched.
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
  key is unaffected, and `seed-content.ts` is unchanged on disk

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
  and the key recorded in `seed-content.ts` is still `course/module/lesson/video.mp4`

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
content key in `seed-content.ts` into the manifest's `assets` block with the
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

### Requirement: Declared assets are checked against the seed

`pnpm verify:content` SHALL additionally report every `assets` entry whose key is
absent from `seed-content.ts`, and SHALL exit non-zero when there is one.

An exhaustive `assets` block goes stale the moment content is renamed or removed
and the seed is regenerated. Without this check the manifest would accumulate
entries for keys nothing asks for any more, and a reader could no longer tell
which placements are real.

#### Scenario: A stale asset entry is named

- **WHEN** the manifest declares an `assets` entry for a key the seed no longer contains
- **THEN** `pnpm verify:content` exits non-zero and names that key as stale

#### Scenario: A manifest matching the seed passes

- **WHEN** every `assets` entry names a key the seed contains, and every key resolves
- **THEN** `pnpm verify:content` exits zero

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
`seed-content.ts` — every `source`, `poster`, `Resource.url` and notes key — and
calls `exists()` on the routed store, failing non-zero and naming every key that
does not resolve.

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

### Requirement: Content seed is generated at build time, not at runtime

The system SHALL provide a build-time script `scripts/generate-course-content-seed.ts` that:

- Reads `public/local-filesystem-lesson/courses.manifest.json` when present and walks the folder named by EACH course entry, in `sequence` order. With no manifest, it walks the single first folder under the content root, as before.
- Emits `src/adapters/persistence/in-memory/seed/seed-content.ts` containing `seedContentCourses`, `seedContentModules`, `seedContentLessonRows`, and `seedContentResourceRows`, PLUS the original pre-normalization names (see "Generated seed preserves the original pre-normalization names"). The module, lesson and resource exports aggregate across every course; each row already carries the `courseId` or `moduleId` that owns it, so no consumer needs a per-course export.
- Emits `seedContentCourses` and `seedContentModules` as parsed domain entities, because neither carries a content key. Emits lessons and resources as **raw rows** — plain objects whose `source`, `poster` and `url` fields hold content KEYS, not URLs — because a bare key does not satisfy `urlOrRelativePath()` and therefore cannot be parsed into a domain entity until an adapter has resolved it.
- Computes slugs for every folder using (a) the `slugOverrides` map of the owning course's manifest entry if present, otherwise (b) automatic kebab-case ASCII normalization.
- Slugifies EVERY path segment of each content key — the course, module, and lesson folder names AND the media/resource file basenames — using the same override + normalization logic, so the emitted key is kebab-case ASCII end to end.
- Extracts `durationSeconds` for each `.mp4` via `ffprobe`. If `ffprobe` is not on `PATH`, the script exits with a non-zero status and a message instructing the developer to install it.
- Emits content KEYS for every `VideoLesson.source`, `VideoLesson.poster` and `Resource.url`. The generator SHALL NOT resolve keys to URLs and SHALL NOT contain a base-URL literal; the public URL prefix is not knowable at generation time because it is a deployment concern.
- Validates every emitted key via `BlobStore.exists(key)` and fails non-zero without a partial write if any key is unresolved (see "Generator validates that every emitted key resolves on disk"). The generator MAY construct a `BlobStore` for this existence check alone; it MUST NOT use it to bake URLs into the output.

The generator SHALL NOT silently discard a course folder. Every folder under the content root is either declared in the manifest and emitted, or absent from it and skipped; when a manifest is present and an undeclared folder exists, the generator SHALL report the skipped folder by name on stderr and continue with exit status zero, because an undeclared folder is a staging area, not an error.

The generated file MUST be committed to git. The script MAY be re-run by hand (`pnpm generate:content-seed`) when content is added or removed; CI does not run it.

#### Scenario: A new lesson is added by dropping files in the content folder

- **WHEN** a developer adds a new folder under `public/local-filesystem-lesson/<course>/<new-lesson>/` containing `lesson.mp4` and `notes.pdf`, then runs the normalization step and `pnpm generate:content-seed`
- **THEN** `seed-content.ts` contains a new video lesson row with a stable slug and a new resource row for the PDF, both with fully-slugified keys that resolve on disk, and both visible in the git diff

#### Scenario: Two declared courses are both emitted

- **WHEN** the manifest declares two course entries and both folders exist under the content root
- **THEN** `seedContentCourses` holds both courses in `sequence` order, and `seedContentModules`, `seedContentLessonRows` and `seedContentResourceRows` each hold the union of both courses' rows

#### Scenario: An undeclared folder is skipped with a named warning

- **WHEN** a manifest is present and a folder exists under the content root that no course entry names
- **THEN** the generator names that folder on stderr, emits nothing for it, and exits zero

#### Scenario: The generated seed contains no base-URL prefix

- **WHEN** `pnpm generate:content-seed` completes
- **THEN** no `source`, `poster` or `url` value in `seed-content.ts` begins with `/local-filesystem-lesson` or any other base-URL prefix — each is a bare content key beginning with the course slug

#### Scenario: A folder name with special characters gets a clean slug

- **WHEN** the script encounters folder `"5 Sound Natural: American Intonation Essentials"`
- **THEN** the generated module slug is `"5-sound-natural-intonation-essentials"` (automatic normalization) UNLESS an entry in the owning course's `slugOverrides` maps the raw name to a different slug

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

Repointing content storage SHALL NOT require regenerating `seed-content.ts`.

#### Scenario: Default boot preserves today's URLs

- **WHEN** the app boots with `USE_COURSE_CONTENT_SEED=1`, no location manifest,
  and `CONTENT_LOCAL_ROOT` unset
- **THEN** every rendered video, poster and resource URL is byte-identical to the
  pre-change output, all beginning with `/local-filesystem-lesson/`

#### Scenario: A CDN prefix is applied by manifest alone

- **WHEN** the manifest declares one public store with
  `publicUrl: "https://cdn.example.com/course-content"` as the default
- **THEN** every rendered video, poster and resource URL begins with
  `https://cdn.example.com/course-content/`, and `seed-content.ts` is unchanged
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

### Requirement: Lesson titles come from the notes heading for allowlisted modules

The generator SHALL derive a lesson's title from the first Markdown `#` heading of that lesson's `readme.md`, but only for modules named in that course's `titleFromNotesModules` allowlist in the manifest. For every module not in that allowlist, the title SHALL continue to be derived from the lesson slug, unchanged.

The allowlist SHALL be per-module, not per-lesson, and SHALL live under the owning course's manifest entry, so enabling a module is a single visible edit scoped to the course it belongs to.

The heading SHALL be adopted only when it carries information the slug could not: if the heading equals the slug-derived title ignoring case, the slug-derived title SHALL be kept. A lesson whose `readme.md` is absent, or whose `readme.md` has no `#` heading, SHALL keep the slug-derived title.

The generator SHALL additionally consult the owning course's `lessonTitleOverrides` table, keyed by the `moduleSlug/lessonSlug` path within that course. An override SHALL take precedence over both the heading and the slug, and SHALL apply whether or not its module is in the allowlist — it is already a per-lesson reviewed decision. The override table exists for lessons whose real name cannot be recovered automatically, such as a lesson with no `readme.md` at all.

The resolved title SHALL be applied once and used for both the lesson and its notes Resource, so the two can never disagree.

When a title is adopted from a heading, apostrophes SHALL be normalized to `’` (U+2019), so a module reads consistently regardless of which character its author typed. No other normalization SHALL be applied — not case, not punctuation spacing, not `&`/`and`. Override values SHALL be written correctly rather than normalized; a test SHALL fail an override value containing `'` (U+0027).

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

#### Scenario: An allowlist entry applies only to its own course
- **WHEN** two courses each contain a module whose slug is `1-intro`, and only one course's manifest entry allowlists `1-intro`
- **THEN** only that course's module adopts its headings, and the other course's module keeps slug-derived titles

#### Scenario: A heading that differs only in case is not adopted
- **WHEN** a lesson in an allowlisted module has the slug-derived title `Intro` and its `readme.md` opens with `# INTRO`
- **THEN** the emitted title remains `Intro`, because capitalization is not information the slug lost

#### Scenario: A lesson with no heading keeps the slug-derived title
- **WHEN** a lesson in an allowlisted module has no `readme.md`, or has one with no `#` heading
- **THEN** the emitted title is the slug-derived one and no error is raised

#### Scenario: An override supplies a title no automatic source can produce
- **WHEN** a lesson has no `readme.md`, so neither a heading nor anything but the mangled slug is available, and the manifest's `lessonTitleOverrides` has an entry for its `moduleSlug/lessonSlug`
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

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL include the filesystem-backed course from `seed-content.ts` in the dependency graph only when the environment variable `USE_COURSE_CONTENT_SEED` is set to `"1"`. When unset or set to any other value, the catalog holds the A1 hardcoded seed (`seed.ts`) alone.

The flag is **additive**: when set, the filesystem-backed course JOINS the A1 course in one catalog rather than replacing it, and the two are ordered by `Course.sequence`. The A1 course is never removed from the catalog by configuration — the flag only decides whether content that needs a large local content root is present.

Because the two seeds are backed by different adapters (in-memory entities and content rows resolved through a `BlobStore`), the lesson and resource ports SHALL be bound to composite adapters that fan out over both. Every read remains filtered by `courseId`, so a delegate that owns none of a course's content contributes nothing.

The default behaviour (A1 seed alone) MUST NOT change as a side effect of this change landing — only an explicit opt-in adds the second course.

#### Scenario: Default dev boot still uses the A1 seed alone

- **WHEN** a developer runs `pnpm dev` without setting `USE_COURSE_CONTENT_SEED`
- **THEN** `getCoursePlatformDeps()` returns a graph whose catalog holds exactly the `seed.ts` course, identical to pre-change behaviour

#### Scenario: Opt-in boot serves both courses

- **WHEN** a developer runs `USE_COURSE_CONTENT_SEED=1 pnpm dev`
- **THEN** `getCoursePlatformDeps()` returns a graph whose catalog holds both the A1 course and the "Advanced Intermediate Course", in `Course.sequence` order, and the home lists both

#### Scenario: Each course's lessons resolve through the adapter that owns them

- **WHEN** lessons are listed for the A1 course and for the filesystem-backed course under the opt-in flag
- **THEN** the A1 course's lessons come back with their literal URLs unchanged, and the filesystem-backed course's lessons come back with their content keys resolved through the `BlobStore`

#### Scenario: A lesson id is resolved by whichever delegate owns it

- **WHEN** `LessonRepository.byId` is called with an id belonging to either seed
- **THEN** the composite returns that lesson, and returns `null` for an id belonging to neither

### Requirement: On-disk content layout is normalized to match slug keys

The system SHALL provide a build-time normalization step that renames every folder AND every media/resource file under `public/local-filesystem-lesson/` to its kebab-case slug form, using the SAME slug resolution as the seed generator (the owning course's `slugOverrides` map from `courses.manifest.json` first, then `scripts/slug.ts` automatic normalization). When no manifest is present, or when the entry being renamed sits outside any declared course folder, automatic normalization alone applies. After normalization, the physical path of each asset (relative to the content root) SHALL be byte-for-byte equal to the content key the generator emits, so `blobStore.url(key)` resolves against Next.js `/public`.

The normalization step SHALL NOT rename `courses.manifest.json` or `rename-manifest.json`; both are generator inputs living at the content root, not content.

Normalization SHALL be idempotent (`slugify(slugify(x)) === slugify(x)`), so re-running it against an already-normalized tree makes no changes. If two distinct raw names within the same parent directory normalize to the same slug, the step SHALL abort with a non-zero status and name the colliding entries, without performing a partial rename of that directory.

#### Scenario: A folder with spaces, capitals, and special characters is renamed

- **WHEN** normalization encounters the folder `"8 Everyday English Phrases PART 2 Master Them!"`
- **THEN** it is renamed on disk to `"8-everyday-english-phrases-part-2-master-them"`

#### Scenario: A media file basename with spaces and accents is renamed

- **WHEN** normalization encounters the file `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** it is renamed on disk to `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"` (extension preserved, stem slugified)

#### Scenario: The manifests at the content root are never renamed

- **WHEN** normalization runs against a content root holding `courses.manifest.json` and `rename-manifest.json`
- **THEN** both keep their exact filenames and neither appears in the rename manifest's entries

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

