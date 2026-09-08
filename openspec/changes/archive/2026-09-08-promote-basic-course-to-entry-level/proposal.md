## Why

The home ladder currently opens with `english-a1-pronunciation` — "Basic — Foundational
Pronunciation" — a four-lesson course hand-written in `seed.ts` as a fixture back when
there was no real content. Now that the basic course ships 48 real lessons, the demo sits
above it on the ladder, and a learner arriving at the entry level meets placeholder
material with two courses both announcing themselves as "Basic".

Deleting the demo removes the only reason the catalog was ever assembled from two sources,
which is the machinery this change gets to retire with it.

## What Changes

- **Delete `src/adapters/persistence/in-memory/seed/seed.ts`** — the A1 course, its two
  modules, four lessons and three resources.
- **Promote the basic course to ladder position 1** and the advanced course to 2, in
  `courses.manifest.json` and its tracked example, then regenerate `seed-content.ts`.
- **Remove the `USE_COURSE_CONTENT_SEED` environment variable.** Its two branches chose
  between the A1 seed and the generated one; with the A1 seed gone, "off" would mean an
  empty catalog. The generated seed becomes the catalog unconditionally. **BREAKING** for
  anyone whose `.env` relies on the old default — the flag is removed from `.env`,
  `.env.example`, `playwright.config.ts` and `scripts/README.md`.
- **Delete `CompositeLessonRepository` and `CompositeResourceRepository`.** They exist
  solely to fan a read out over the two seeds; nothing else constructs them. With one
  source the lesson and resource ports bind directly to the local-filesystem adapters.
- **Fix `e2e/home-course-ladder.spec.ts`**, which asserts two course cards, "2 levels, in
  order" and "2 courses". It has been failing since the basic course landed and took the
  catalog to three — `pnpm verify` does not run Playwright, so it went unnoticed.
- Re-point the `lesson-page` and `lesson-view-polish` scenarios that name a concrete A1
  lesson URL at a lesson that will still exist.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `course-content-storage`: the generated seed becomes the whole catalog — the opt-in env
  var and the two-source composite binding are removed.
- `lesson-page`: the route scenario names an A1 lesson URL that will no longer resolve.
- `lesson-view-polish`: the document-title scenario names the same A1 lesson URL.

## Non-goals

- **Keeping the YouTube lesson alive.** `SEED_LESSON_YOUTUBE_ID` is the only lesson in
  either seed whose `source` is a YouTube embed, and the generated seed is written from
  disk and cannot hold a hand-authored one. The player's YouTube provider stays covered by
  its unit tests and its stories, but no live content reaches it until a course brings one.
  Declaring externally-hosted lessons from the manifest is a separate feature.
- **Rewriting the twelve stories and tests that spell `english-a1-pronunciation` inline.**
  They never imported `seed.ts`; the slug is fixture text inside them and nothing about it
  breaks.
- **Touching course content.** No file under `public/local-filesystem-lesson/` moves; only
  the two `sequence` integers in the manifest change.

## Impact

- **Deleted**: `src/adapters/persistence/in-memory/seed/seed.ts`,
  `src/adapters/persistence/composite/**` (two adapters and their tests).
- **Changed**: `use-case-dependencies.ts` loses the flag, the branch and the composites;
  its test file loses every A1 assertion. `course-navigator.stories.tsx` supplies its own
  fixture. `playwright.config.ts`, `.env`, `.env.example`, `scripts/README.md` drop the
  flag.
- **Manifests and seed**: `courses.manifest.json` (untracked),
  `scripts/courses.manifest.example.json`, and a regenerated `seed-content.ts` whose only
  diff is two `sequence` integers.
- **E2E**: `home-course-ladder.spec.ts` rewritten against the two real courses; the four
  other specs mention the flag only in comments.
- **App**: no component, route or domain change. The home shows two rungs — Basic Course,
  then Advanced Intermediate Course.
