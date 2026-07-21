# Capability: course-content-storage (delta)

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Content seed is generated at build time, not at runtime

The system SHALL provide a build-time script `scripts/generate-course-content-seed.ts` that:

- Walks `public/local-filesystem-lesson/<course-slug>/` recursively.
- Emits `src/adapters/persistence/in-memory/seed/seed-content.ts` containing a `seedContentCourse`, `seedContentModules`, `seedContentLessons`, and `seedContentResources` array, each parseable by the existing domain schemas, PLUS the original pre-normalization names (see "Generated seed preserves the original pre-normalization names").
- Computes slugs for every folder using (a) the override map in `scripts/slug-overrides.ts` if present, otherwise (b) automatic kebab-case ASCII normalization.
- Slugifies EVERY path segment of each content key — the course, module, and lesson folder names AND the media/resource file basenames — using the same override + normalization logic, so the emitted key is kebab-case ASCII end to end. (Previously the file basename was preserved verbatim, which produced keys with spaces and accents that did not resolve on disk.)
- Extracts `durationSeconds` for each `.mp4` via `ffprobe`. If `ffprobe` is not on `PATH`, the script exits with a non-zero status and a message instructing the developer to install it.
- Resolves every `VideoLesson.source` and `Resource.url` via a `LocalFilesystemBlobStore` instance, so the generated seed is portable to other BlobStore drivers in the future.
- Validates every emitted key via `BlobStore.exists(key)` and fails non-zero without a partial write if any key is unresolved (see "Generator validates that every emitted key resolves on disk").

The generated file MUST be committed to git. The script MAY be re-run by hand (`pnpm generate:content-seed`) when content is added or removed; CI does not run it.

#### Scenario: A new lesson is added by dropping files in the content folder

- **WHEN** a developer adds a new folder under `public/local-filesystem-lesson/<course>/<new-lesson>/` containing `lesson.mp4` and `notes.pdf`, then runs the normalization step and `pnpm generate:content-seed`
- **THEN** `seed-content.ts` contains a new `VideoLesson` entry with a stable slug and a new `Resource` entry for the PDF, both with fully-slugified keys that resolve on disk, and both visible in the git diff

#### Scenario: A folder name with special characters gets a clean slug

- **WHEN** the script encounters folder `"5 Sound Natural: American Intonation Essentials"`
- **THEN** the generated module slug is `"5-sound-natural-intonation-essentials"` (automatic normalization) UNLESS an entry in `slug-overrides.ts` maps the raw name to a different slug

#### Scenario: A media file basename is slugified into the key

- **WHEN** a lesson folder contains `"Aprende Inglés Americano con Fluidez desde Cero.mp4"`
- **THEN** the emitted `VideoLesson.source` key ends in `"aprende-ingles-americano-con-fluidez-desde-cero.mp4"`, and the same slug is the file's name on disk after normalization

#### Scenario: A duplicate `.mp4` filename inside the same section still produces unique URLs

- **WHEN** two lesson folders in the same section each contain a file that slugifies to `aprende-ingles-americano-con-fluidez-desde-cero.mp4`
- **THEN** the generated URLs are different because each lesson key includes the lesson slug, not the bare filename

#### Scenario: Missing ffprobe fails loudly

- **WHEN** the developer runs `pnpm generate:content-seed` and `ffprobe` is not on `PATH`
- **THEN** the script exits non-zero with stderr "ffprobe not found; install ffmpeg or set FFPROBE_PATH" and does not write a partial `seed-content.ts`
