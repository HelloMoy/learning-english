## Why

In the Basic Course, two consonant lessons play each other's video: the /ð/
lesson (`3-consonants/13-th-voiced`) plays the /ŋ/ lecture and the /ŋ/ lesson
(`3-consonants/21-ng`) plays the /ð/ lecture. A learner opens the lesson titled
/ð/, reads notes and a PDF about /ð/, and watches a video teaching a different
sound. It is live in production.

## What Changes

- Swap the two `source` URLs in `src/content/basic-course.json` so each lesson
  declares the video that teaches its own sound:
  - `13-th-voiced` (/ð/) → `https://www.youtube.com/embed/q_rv_7mopKU`
  - `21-ng` (/ŋ/) → `https://www.youtube.com/embed/jOF2i5teTfs`
- Pin both pairings with a test over the tracked manifests, so the crossing
  cannot come back unnoticed.

Nothing else about the two lessons is wrong. Their order, titles, posters,
notes, resources and `durationSeconds` already describe the right sound — the
declared 373 s and 660 s match the /ð/ and /ŋ/ lectures (373 s and 661 s on
YouTube), which is how the crossing was confirmed to be in `source` alone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `course-content-storage`: adds the requirement that a lesson's declared video
  is the one that teaches that lesson, with the /ð/ and /ŋ/ pairings as its
  scenarios.

## Impact

- `src/content/basic-course.json` — two `source` values.
- `src/adapters/persistence/content-manifest/content-manifest.test.ts` — one new
  test beside the existing video-source tests.
- No schema, adapter, component, message or dependency change. Lesson ids and
  slugs are untouched, so URLs, enrollments and completion records keep pointing
  at the same lessons.

## Non-goals

- Auditing video pairings beyond the Basic Course. Its other 46 lessons were
  compared title-by-title against YouTube while confirming this report and all
  match; the Advanced Intermediate Course and the Atlas were not checked.
- Rewriting stored learner state. A learner who already completed either lesson
  keeps that completion.
- Changing how sources are declared, validated or resolved.
