## Context

`src/content/basic-course.json` is the hand-edited source of truth for the Basic
Course; there is no generation step. Lessons `3-consonants/13-th-voiced` (/ð/)
and `3-consonants/21-ng` (/ŋ/) each declare the other's YouTube `source`.

What was checked to locate the defect:

| Lesson                | Declared `source` | YouTube title | YouTube length | Declared `durationSeconds` |
| --------------------- | ----------------- | ------------- | -------------- | -------------------------- |
| `13-th-voiced` (/ð/)  | `jOF2i5teTfs`     | "ŋ"           | 661 s          | 373                        |
| `21-ng` (/ŋ/)         | `q_rv_7mopKU`     | "ð"           | 373 s          | 660                        |

Each lesson's declared duration matches the _other_ row's video, and each
lesson's local `thumbnail.jpeg` shows its own sound. So duration, poster, notes
and resources are right and only `source` is crossed.

The existing tests could not catch this: both values are valid YouTube embed
URLs and no two lessons share one, which is all
`the tracked manifests' video sources` asserts.

## Goals / Non-Goals

**Goals:**

- Each of the two lessons declares the lecture for its own sound.
- A test fails if either pairing is crossed again.

**Non-Goals:**

- A general "is this the right video" check. Nothing in the repository knows
  what a video teaches; that knowledge lives on YouTube.
- Touching `durationSeconds`, posters, notes, resources, ids or slugs.

## Decisions

**Swap the two `source` values, nothing else.** The alternative — swapping the
lessons' other fields around the videos — would move ids and slugs, breaking
URLs and stored completion for a defect that is two strings wide.

**Pin the two pairings by literal URL.** A test that asked YouTube for each
video's title would check the real thing, but it puts a network call in the unit
suite and breaks F.I.R.S.T. The literal pin follows the existing precedent in
the same file (`WHEN the /æ/ lesson is read THEN it names its sound AND plays
its own video`).

**Keep `durationSeconds` at 660 for /ŋ/** although YouTube reports 661. It was
already declared for the right video and a one-second difference is outside this
change.

## Risks / Trade-offs

- [A learner has a stored playback position on either lesson, taken from the
  wrong video] → The position is keyed by lesson id and is only _offered_ on
  first play, never applied on mount; the worst case is a resume offer at a
  timestamp that meant something in the other lecture. Not worth a data
  migration.
- [A learner already completed a lesson having watched the wrong lecture] →
  Completion is kept; they can rewatch. Clearing it would punish them for our
  defect.
- [The literal pin goes stale if a lecture is re-uploaded] → That is the pin
  doing its job: the test fails and whoever changes the URL confirms the new
  video on purpose.

## Testing strategy

- **Vitest unit** — `src/adapters/persistence/content-manifest/content-manifest.test.ts`,
  inside the existing `the tracked manifests' video sources` block, reusing its
  `declaredVideos()` helper. One test reads the two lesson paths and expects each
  to declare its own lecture. It is written first and fails against the current
  manifest.
- **Vitest component / Playwright e2e** — none. No component or flow changes;
  the player already renders whatever `source` the catalog serves.
- **Manual** — open both lesson pages in the running app and confirm the
  embedded video id.
