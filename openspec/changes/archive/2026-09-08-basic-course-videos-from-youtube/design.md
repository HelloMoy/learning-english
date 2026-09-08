## Context

The content pipeline has one shape for a lesson's video: a `.mp4` on disk under
`public/local-filesystem-lesson/<course>/<module>/<lesson>/`. `classifyLessonFolder`
finds it, the generator emits a **content key** in `LessonRow.source`, and
`resolveLessonRow` turns that key into a URL through `BlobStore.url()` on every
read. That indirection is deliberate: it is what lets storage move from `/public`
to S3/R2 without regenerating `seed-content.ts`.

YouTube does not fit that model. Its URL is not a key into a store we own, there
is no object path to compute, and no `BlobStore` driver could produce it from a
key. The 48 Basic Course videos are already uploaded there as unlisted, and the
player already knows what to do with a YouTube link (`youtubeVideoIdFrom` →
Vidstack's `youtube/<id>` provider, shipped in `6295081`). The gap is purely in
the pipeline: nothing can *say* that a lesson's video lives elsewhere.

Constraint worth naming up front: `resolveLessonRow` calls `blobStore.url(row.source)`
unconditionally. Dropping a YouTube URL into the seed today yields
`/local-filesystem-lesson/https://www.youtube.com/embed/...`.

## Goals / Non-Goals

**Goals:**

- Let a course declare, per lesson, that its video is served by an external URL.
- Keep every other asset of that same lesson — poster, PDFs, notes — keyed and
  resolved exactly as today.
- Keep the change revertible by editing data, not code.
- Keep `BlobStore` the single point of resolution for everything that IS a key.

**Non-Goals:**

- Generalising to arbitrary media hosts, or adding provider negotiation.
- Moving `advanced-intermediate-course`, or deleting any local `.mp4`.
- Fetching anything from YouTube at build or run time.

## Decisions

### D1 — The mapping is a per-course table in `courses.manifest.json`

`lessonVideoSources: Record<"moduleSlug/lessonSlug", url>`, alongside the
existing `slugOverrides` / `moduleTitleOverrides` / `lessonTitleOverrides`.

The manifest is already the file that says "the disk says X, but the truth is Y"
for this course, and it already has a reviewed two-segment key convention with a
`superRefine` that explains the shape when an author gets it wrong. Reusing it
means no new file to load, no new validation vocabulary, and one diff to review.

*Alternatives:* a separate `youtube-sources.json` (a second config file the
generator must find, validate and keep in sync, for one field); a `video.url`
marker inside each lesson folder (48 new files, and the mapping stops being
reviewable at a glance).

### D2 — The bypass is decided by the value's shape, reusing the domain's own predicate

`resolveLessonRow` will skip `BlobStore.url()` when the value is already an
absolute `http(s)` URL. That test must be **the same one** the domain uses to
accept the value, or a string could pass the adapter's bypass and then fail
`Lesson.parse`. `src/domain/entities/url-or-path/url-or-path.ts` already contains
exactly that predicate as a private `isAbsoluteHttpUrl`; this change **exports
it** rather than writing a second definition that can drift.

Detection is by shape, never by course or by a flag on the row: the invariant we
want is "a value that is already a URL is not a key", which is true of any row
from any source.

*Alternatives:* reusing `youtubeVideoIdFrom` (too narrow — it encodes one
provider into a rule about URLs in general); a new `isExternal` boolean on the
row (redundant state that can disagree with the value next to it).

### D3 — Substitution happens in the generator, not in `discriminate-lesson`

`classifyLessonFolder` answers "what is on disk in this folder". It has no course
context and should not grow any. The generator already holds the `ResolvedCourse`
when it assembles a row, so the substitution — take the declared URL if there is
one, otherwise the derived key — happens there. `discriminate-lesson.ts` is
untouched, which narrows the blast radius from what the proposal first assumed.

### D4 — The local `.mp4` files stay on disk

Two reasons, one of them load-bearing: `durationSeconds` is required by
`VideoLesson` and comes from `probeDurationSeconds` (ffprobe) reading the local
file. The YouTube provider does not supply it at generation time. Keeping the
files also makes rollback a data edit — empty the table, regenerate.

Reclaiming the disk space is a separate change that must first answer where
duration comes from.

### D5 — A declared value is validated as an absolute `http(s)` URL

Zod v4 top-level `z.url()`, refined to `http:`/`https:`. A content key or a
site-relative path written into this table would otherwise be silently resolved
against the local store — the exact bug the field exists to prevent.

### D6 — URL sources are excluded from the generator's on-disk validation

`generate-course-content-seed.ts` calls `exists(key)` on every emitted key and
aborts if one is missing. An external URL has no file under the content root, so
it is skipped. The lesson's `poster` and resource keys are still checked — only
the `source` value that is a URL is exempt.

The same exclusion belongs in `content-keys/content-keys.ts`, the inventory that
`pnpm verify:content` and `move-content.ts` both read. Filtering there rather
than in each script is what stops the two from checking different sets — the
reason that module exists. Without it, `verify:content` would demand 48 files
that were never meant to exist.

## Risks / Trade-offs

- **A lesson is mapped to the wrong video.** → The mapping was derived by matching
  each YouTube title against the lesson's `readme.md` heading, its
  `slugOverrides` raw name, and its humanized slug; all 48 matched with no
  lesson left over. The link supplied independently by the user (`yY7RWGUbqng`)
  landed on `2-vowels/3-the-vowel-sound-uu`, which the manifest declares as
  "3 The Vowel Sound ʊ (o corta)" — an independent confirmation. The final diff
  is 48 reviewable lines.
- **YouTube has two duplicate uploads** (`Ejercicios ... pronunciacion 2`,
  `The Vowel Sound ɛ`) — 50 videos, 48 distinct titles. → One of each pair is
  used; the other is simply not referenced. Nothing breaks if the unused one is
  later deleted.
- **Playback now depends on a third party.** An unlisted video switched to
  private, or embedding disabled, breaks that lesson with no build-time error.
  → Accepted; it is the point of the change. Nothing detects it automatically.
- **Local dev loses offline playback** for the Basic Course. → Accepted.
- **`durationSeconds` describes the local file, not the YouTube upload.** If a
  re-upload were trimmed differently, resume positions would be slightly off.
  → The uploads are the same recordings; a mismatch would need a re-upload, which
  regenerating the seed does not detect.
- **The "single point of URL resolution" invariant gains an exception**, which is
  a real loss of simplicity. → Mitigated by writing the exception into the spec
  rather than leaving it as adapter trivia, and by keeping the test shape-based
  so it cannot quietly grow provider-specific branches.

## Migration Plan

1. Schema, generator and adapter changes land with the table still empty — the
   generated seed must be byte-identical at this point.
2. Add the 48 entries to `public/local-filesystem-lesson/courses.manifest.json`
   and mirror the new field in `scripts/courses.manifest.example.json`.
3. Regenerate the seed; review that the diff touches only 48 `source` values in
   the Basic Course and nothing else — no poster, no resource, no title, and
   nothing in `advanced-intermediate-course`.
4. Verify playback in the browser for one lesson per module.

**Rollback:** empty `lessonVideoSources` and regenerate. Code stays; the local
files were never removed.

## Testing strategy

All new coverage is **Vitest unit**. No component or e2e work: the player's
YouTube handling is already covered by `lesson-video-player.test.tsx` and
`playback-positioned-video-player.test.tsx`, and this change alters what string
reaches the player, not how the player behaves.

| Behavior | Layer | File |
| --- | --- | --- |
| `lessonVideoSources` parses; key must be `moduleSlug/lessonSlug`; value must be an absolute `http(s)` URL; absent table resolves to `{}` | Vitest unit | `scripts/courses-manifest/courses-manifest.test.ts` |
| A declared lesson emits the URL in `source`; an undeclared one keeps its content key; `poster` and resources are unaffected | Vitest unit | `scripts/generate-course-content-seed.test.ts` |
| A URL `source` is skipped by the `exists` validation pass while its `poster` is still checked | Vitest unit | `scripts/generate-course-content-seed.validation.test.ts` |
| An absolute URL bypasses `BlobStore.url()`; a key does not; a URL-sourced lesson still resolves its poster | Vitest unit | `src/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row.test.ts` |
| No URL enters the store inventory, while a hosted lesson's poster still does | Vitest unit | `scripts/content-keys/content-keys.test.ts` |

**Patterns to mirror:**

- `resolve-content-row.test.ts` already has a hand-written `fakeBlobStore`
  exposing `keysAsked`, documented as existing "only for the two cases that must
  prove `url` was NOT consulted". The bypass test asserts against `keysAsked`
  the same way — proving the store was never asked, not merely that the output
  looks right.
- `courses-manifest.test.ts` already covers rejected override-key shapes; the new
  key and value cases follow those, asserting on the message so a bad entry stays
  diagnosable.
- Per `AGENTS.md`, use `@faker-js/faker` for incidental values; hardcode only the
  URL and key shapes under test, since those are what the behavior is tied to.

Each task is Red → Green → Refactor: the failing test lands before the
production line it justifies.

## Open Questions

- Should the Basic Course's local `.mp4` files eventually be deleted, and if so
  where does `durationSeconds` come from? Deferred; see D4.
- Should posters also move to YouTube's generated thumbnails? Deliberately not
  now — the lessons have reviewed local thumbnails and `lesson-view` already
  prefers a lesson's own poster over the provider's.
