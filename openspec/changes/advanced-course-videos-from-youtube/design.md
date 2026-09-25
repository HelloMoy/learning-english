## Context

The Basic Course moved to YouTube in `2026-09-08-basic-course-videos-from-youtube`.
That change built everything a YouTube-sourced lesson needs: `source` may be an
absolute URL, `resolveLessonRow` passes such a URL past `BlobStore`, and the
Vidstack player routes `youtube.com/embed/<id>` to its YouTube provider. Since
then the catalog stopped being generated — `src/content/<course>.json` is the
hand-edited source of truth — so what the earlier change did through
`lessonVideoSources` and a generator is now a direct edit of `source`.

The Advanced Intermediate Course is the last course on local video. Three
things keep it out of production, and only three:

1. its 107 `source` values are content keys to `.mp4` files a deploy never has;
2. its manifest declares `"draft": true`, which hides it when `NODE_ENV` is
   `production`;
3. `.gitignore` excludes its whole content folder, so its posters, notes and
   resources are missing from a deploy too.

The YouTube side is done: the owner uploaded all 107 lectures as unlisted
videos between 2026-09-08 and 2026-09-24. The ten videos uploaded on
2026-09-07 are the tail of the Basic Course's consonants and are not part of
this change.

## Goals / Non-Goals

**Goals:**

- Every Advanced Intermediate lesson plays from YouTube, with its local poster,
  notes and resources unchanged.
- The course is served in production with no environment configuration.
- A fresh clone (and CI) carries every non-video file the catalog references.
- The e2e suite stops depending on video the repository cannot carry.

**Non-Goals:**

- Removing the draft-visibility machinery, deleting local `.mp4` files,
  rewording lesson descriptions, touching the player or the domain — see the
  proposal.

## Decisions

### D1. The mapping is data collected once, verified by duration

The lesson → video mapping was read from YouTube Studio (title, upload date,
duration) and matched on module and lesson position. Titles alone are
ambiguous — three videos are called "Intro" — so upload order resolved them
(each "Intro" was uploaded immediately before its module's other lectures), and
duration settled it: all 107 Studio durations equal the manifest's
`durationSeconds` within one second, the difference being rounding. The result
is recorded in `youtube-mapping.json` beside this design, keyed
`moduleSlug/lessonSlug`, so the edit is reproducible and reviewable.

*Alternative considered:* calling the YouTube Data API at build time. Rejected
for the same reason as the Basic Course — the mapping is stable declared data,
and a build-time network dependency buys nothing.

### D2. Edit `source` in place; nothing else in the lesson moves

`source` becomes `https://www.youtube.com/embed/<id>` — the exact form the Basic
Course uses, which `youtubeVideoIdFrom` already parses. `durationSeconds` stays
the manifest's value (it matches YouTube's); `poster`, `notesKey`, resources,
ids and titles are untouched. Lesson ids key saved progress, so leaving them
alone is what keeps learners' progress intact.

The edit is applied by a throwaway script from `youtube-mapping.json` rather
than by hand, and the resulting diff is checked to touch exactly 107 `source`
lines plus the `draft` line.

### D3. Publish by deleting `"draft": true`, keep the machinery

`draft-course-visibility` was designed so that publishing is a one-line data
edit and removing the flag is a separate change. This change takes only the
first step. The dormant filter costs nothing; removing it touches its own
module, the loader, the schema, `.env.example` and a spec, and deserves its own
review.

The tests in `content-manifest.test.ts` that exercise "drafts hidden" against
the *tracked* manifests assumed a tracked draft existed. With none left they
are restated: hiding drafts now leaves the shipped catalog unchanged. The
filter's own behavior stays covered by `visible-course-manifests`' fixture-based
tests, which do not depend on the tracked data.

### D4. Track the text assets with the Basic Course's negation

`.gitignore` gets `!public/local-filesystem-lesson/advanced-intermediate-course/`
next to the Basic Course's line, under the same comment's reasoning. The
existing `**/*.mp4|mov|webm|mkv` rules already keep every video out; that
combination is exactly what the "Video bytes are never tracked" requirement
was written for. All 212 non-video files in the folder are referenced by the
manifest (none are strays), so the folder is tracked whole rather than
file-by-file.

### D5. A catalog-wide guard that every video lesson is a YouTube embed

A test over `courseManifests` asserts every video lesson's `source` is a
`youtube.com/embed/<id>` URL and that no two lessons share one. It turns the
state this change reaches into an invariant: a lesson added later with a local
key — which would silently 404 in production — fails CI instead. It lives in
`content-manifest.test.ts`, beside the other assertions about the shipped
catalog.

### D6. Retire the `self-hosted-content` quarantine block by block

`skipOnCi("self-hosted-content")` exists only because CI lacked this course's
files. Once they are tracked and the lessons are YouTube-sourced, each block
using it is reclassified by what it actually waits on:

- needs only catalog data or text assets → the skip is removed and it runs on
  CI;
- waits on video playback → it becomes `skipOnCi("youtube")`, the same limit
  the Basic Course's playback specs already carry;
- drives a native `<video>` element that no longer exists → it is rewritten
  against the YouTube provider if the behavior is still the app's, or deleted
  where it asserted self-hosted-only behavior that the app no longer exhibits
  and Basic Course specs already cover the YouTube equivalent.

When no caller is left, the `"self-hosted-content"` reason is removed from
`skipOnCi`'s union, so it cannot be reintroduced by habit.

Lifting the quarantine also exposes what it was hiding. A block that fails for
a reason unrelated to video — stale selectors after a redesign, a race — is
repaired here, because leaving it would turn CI red. A block that exposes a
genuine product defect is marked `test.fixme` naming the defect, never skipped
under a borrowed environment reason: the 320px module overview overflows
because its title sets a single word wider than the viewport, and that fix is
its own change.

## Testing strategy

| Behavior | Layer | Where |
| --- | --- | --- |
| Every catalog video lesson is a unique YouTube embed (D5) | Vitest unit | `src/adapters/persistence/content-manifest/content-manifest.test.ts`, mirroring its existing "GIVEN the tracked course manifests" block |
| No tracked manifest is a draft; hiding drafts leaves the shipped catalog whole (D3) | Vitest unit | same file, restating the "the tracked manifests" and "with drafts hidden" blocks |
| A YouTube `source` bypasses `BlobStore` while poster/resources resolve | already covered | `resolve-content-row.test.ts` (Basic Course change) — no new test |
| Advanced course served in production with no env | Vitest unit | the restated drafts-hidden test (`SHOW_DRAFT_COURSES=0` ≡ production default) |
| Text assets tracked, video ignored | shell check in tasks | `git check-ignore` / `git ls-files` on a readme, a PDF and an `.mp4` |
| Lessons play from YouTube in the browser | Playwright e2e + manual Playwright MCP | existing specs, reclassified per D6; one lesson per module checked visually |

Red first: the D5 test fails on today's manifest (107 content keys) before the
data edit, and the "no draft" test fails before `draft` is deleted.

## Risks / Trade-offs

- [A video is unlisted but embedding is disabled, or it is still processing] →
  every lesson of the course is opened once in the browser during verification;
  Studio lists all 107 as "Uploaded", none as processing.
- [An e2e block silently loses coverage when re-skipped as `youtube`] → each
  reclassification is listed in tasks with its reason; a block is only deleted
  when a Basic Course spec asserts the same behavior on the YouTube provider.
- [21 MB added to repository history permanently] → accepted; it is the same
  trade the Basic Course made, and these files cannot be regenerated.
- [Learners on production see a new course mid-session] → no migration needed;
  ids are unchanged and the course simply appears on the ladder.

## Migration Plan

1. Merge to `develop`; the preview at `develop.english-course.online` serves
   the course (Preview builds are `NODE_ENV=production`, so this is also the
   first real check that drafts no longer hide it).
2. Promote `develop` → `main` as usual.

Rollback: revert the merge commit. Re-adding `"draft": true` alone would also
hide the course again without touching the rest.

## Open Questions

None.
