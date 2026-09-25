## Why

The Advanced Intermediate Course is invisible in production. Its 107 lessons play
`.mp4` files from `public/local-filesystem-lesson/advanced-intermediate-course/`,
which is 15 GB and gitignored, so a deploy has none of them — and neither its
posters, notes nor PDFs, which are ignored along with the video. The course is
therefore held back with `"draft": true`.

Every one of those 107 videos is now published on the channel as an unlisted
YouTube video (uploaded 2026-09-08 → 2026-09-24). The Basic Course already made
this exact move, and the machinery it needed — absolute URLs in `source`, the
`BlobStore` bypass, the player's YouTube provider — is all in place. What is
left is data, one `.gitignore` rule, and the flag.

## What Changes

- **107 `source` values in `src/content/advanced-intermediate-course.json`**
  change from content keys to `https://www.youtube.com/embed/<id>`. The mapping
  was read from YouTube Studio and checked lesson by lesson: every video's
  duration matches the manifest's `durationSeconds` within one second
  (rounding). `poster`, `notesKey`, resources, titles, ids and durations are
  untouched.
- **`"draft": true` is deleted from the manifest**, so the course is served in
  every environment — the one-line publish the `draft-course-visibility` spec was
  shaped for.
- **The course's text assets become tracked**: `.gitignore` gains the same
  negation the Basic Course has, so its 212 non-video files (~21 MB: 105
  posters, 72 notes, 30 PDFs, 2 PNGs, 2 DOCX, 1 PPTX — every one referenced by
  the manifest) ship with the repo. The video rules keep all 15 GB out.
- **The `self-hosted-content` CI quarantine is retired.** Its stated cause —
  "the Advanced Intermediate Course's video is gitignored" — stops being true.
  Each quarantined e2e block is reclassified: blocks that only needed the
  course's text assets run on CI again; blocks that wait on playback move to the
  existing `youtube` skip, like their Basic Course counterparts; blocks that
  drove a native `<video>` are rewritten against a YouTube-sourced lesson or
  removed where the Basic Course already covers the behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `course-content-storage`: the "Video bytes are never tracked by git"
  requirement extends its tracked-text-assets rule from the Basic Course to the
  Advanced Intermediate Course; the "Declaring a lesson's source as an external
  URL" rule now covers both courses, so no lesson in the catalog depends on a
  local video file.
- `draft-course-visibility`: its scenarios name the Advanced Intermediate Course
  as the draft; once no course is a draft, they are restated against a generic
  draft manifest. The requirements themselves are unchanged.

## Non-goals

- **Removing the draft-visibility machinery.** With no draft left the filter is
  dormant, but deleting it is the second, independent step its spec describes
  and belongs to its own change.
- **Deleting the local `.mp4` files.** They stay on disk; reclaiming 15 GB is a
  separate decision, and keeping them makes the change revertible.
- **Touching the player, the adapters or the domain.** YouTube sources already
  work end to end for the Basic Course.
- **Rewording lesson descriptions** ("Resource below" dangles in all 155
  lessons) — a content decision with its own change.
- **Changing video visibility on YouTube.** Unlisted-by-link stays the posture.
- **Calling the YouTube Data API.** The mapping is declared data.

## Impact

- `src/content/advanced-intermediate-course.json` — 107 `source` values; `draft`
  removed.
- `.gitignore` — one negation for `public/local-filesystem-lesson/advanced-intermediate-course/`.
- `public/local-filesystem-lesson/advanced-intermediate-course/**` — 212 files
  newly tracked (~21 MB); no video.
- `e2e/ci-unavailable.ts` and the specs calling `skipOnCi("self-hosted-content")`
  — quarantine retired, blocks reclassified.
- Tests asserting the advanced course is a draft or sources local video, if any,
  are updated to the new data.
- Production: the course appears on the home ladder, its routes resolve, and its
  lessons play from YouTube. Saved progress is unaffected — lesson ids do not
  change.
