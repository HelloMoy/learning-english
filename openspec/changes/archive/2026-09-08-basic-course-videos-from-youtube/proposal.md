## Why

The Basic Course's 48 video lessons are already published on YouTube as unlisted
videos, but the app still plays the `.mp4` files sitting in
`public/local-filesystem-lesson/basic-course/`. Those bytes dominate the ~15 GB
content tree that slows the Next.js dev server, and they duplicate delivery
YouTube already does better — adaptive bitrate, global CDN, no egress cost.

The player half of this is already done: `youtubeVideoIdFrom` routes a YouTube
link to Vidstack's `youtube/<id>` provider. What is missing is a way to *say*
that a lesson's video lives on YouTube. Nothing in the content pipeline can
express it today.

## What Changes

- **`courses.manifest.json` gains a `lessonVideoSources` table.** Keys are
  `moduleSlug/lessonSlug` pairs — the same shape and validation as the existing
  `lessonTitleOverrides` — and values are YouTube embed URLs. An absent entry
  keeps today's behavior exactly.
- **The seed generator emits the declared URL in `source`** instead of the
  content key it derives from the on-disk `.mp4`. A lesson with no entry is
  untouched.
- **The generator's key-resolution check skips declared URLs.** Today every
  emitted key must resolve to a file on disk; a YouTube URL is not a key and
  would fail that check.
- **`resolveLessonRow` stops sending absolute URLs through `BlobStore.url()`.**
  Today the call is unconditional, so a YouTube URL would resolve to
  `/local-filesystem-lesson/https://www.youtube.com/embed/...`.
- **The Basic Course's 48 lessons get their entries**, mapped and verified
  against the channel's video list.
- **`scripts/courses.manifest.example.json` documents the new field**, since it
  is the tracked record of a manifest that is otherwise untracked.

Not a breaking change: every existing manifest stays valid, and a course that
declares no `lessonVideoSources` produces a byte-identical seed.

## Capabilities

### New Capabilities

None. This extends how an existing capability declares and resolves a lesson's
video source.

### Modified Capabilities

- `course-content-storage`: a lesson's video source may be a declared external
  URL rather than a content key. Touches four of its requirements — the
  manifest's shape, the "BlobStore is the single point of URL resolution"
  invariant (which gains a stated exception), the read-time key resolution in
  the lesson adapter, and the generator's on-disk key validation.

## Non-goals

- **Migrating `advanced-intermediate-course`.** Only the Basic Course moves; the
  other course keeps every video local.
- **Deleting the local `.mp4` files.** They stay on disk after this change.
  Reclaiming that space is a separate decision, and keeping them means the
  change is revertible by emptying one table.
- **Moving posters, PDFs, or lesson notes.** Only `source` changes. Every other
  asset keeps its content key and its current resolution path, including the
  thumbnails of the very lessons that move to YouTube.
- **Touching the player.** `LessonVideoPlayer` already handles YouTube sources.
- **Calling the YouTube Data API.** The mapping is declared data in the
  manifest, not something fetched at build or run time.
- **Supporting arbitrary video hosts.** The field carries a URL and the player
  recognizes YouTube; no Vimeo/Wistia provider work is in scope.
- **Making videos private or access-controlled.** Unlisted-by-link is the
  intended posture and is unchanged here.

## Impact

**Content pipeline (`scripts/`)**

- `courses-manifest/courses-manifest.ts` — new `lessonVideoSources` field on
  `CourseDeclaration`, its validation, and its resolved counterpart.
- `discriminate-lesson.ts` / `generate-course-content-seed.ts` — emit the
  declared URL in place of the derived video key.
- `content-keys/content-keys.ts` — exclude declared URLs from the inventory
  `pnpm verify:content` and `move-content.ts` both walk. This is the shared
  inventory, so `verify-content.ts` itself needs no change; filtering in one
  place is what keeps the two scripts checking the same set.
- `courses.manifest.example.json` — document the new field.

**Adapters (`src/`)**

- `persistence/local-filesystem/resolve-content-row/resolve-content-row.ts` —
  pass an absolute URL through untouched.
- `persistence/in-memory/seed/seed-content.ts` — regenerated; 48 `source` values
  in the Basic Course change from content keys to YouTube URLs.

**Content data**

- `public/local-filesystem-lesson/courses.manifest.json` — 48 new entries
  (untracked file).

**Not affected**

- The domain. `Lesson.source` is already `urlOrRelativePath()`, which accepts an
  absolute URL; no entity, port, or use case changes.
- Playback, resume, and progress behavior, which read the resolved source and do
  not care where it points.
