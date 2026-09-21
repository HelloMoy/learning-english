## Context

A sweep of all 462 stories, driven through Playwright against a clean Storybook
instance, found 24 stories that do not work and 4 that only look broken.

**The crash (9 stories).** `Cinema/AchievementsView` (4) and
`Components/MyLearningView` (5) never mount. Storybook shows its error display:

```
Module "node:fs" has been externalized for browser compatibility.
Cannot access "node:fs.existsSync" in client code.
  at http://localhost:6010/src/adapters/persistence/blob-store/content-locations/content-locations.ts:1:46
```

The chain, read out of the preview's live module graph rather than inferred:

```
achievements-view.tsx / my-learning-view.tsx
  → use-resolved-continue-watching.ts          (value import)
  → src/app/[locale]/resolve-continue-watching.ts   (value: resolveContinueWatchingPanel)
  → src/app/[locale]/actions.ts                (value: findContinueWatchingAction)
  → in-memory/use-case-dependencies.ts         (value: getCoursePlatformDeps)
  → blob-store/create-content-blob-store.ts
  → blob-store/content-locations.ts            → node:fs  ✗
```

Two details matter. First, every `import type` along the way is erased as
expected — the graph survives on three genuine value imports. Second,
`useResolvedContinueWatching` takes the resolver as a **default parameter**
(`resolve = resolveContinueWatchingPanel`), so the module is evaluated at import
time whether or not a story overrides it. Every one of the nine stories *does*
override it. They crash on an import they never call.

**The fixtures (15 stories).** `public/videos/vowels-short-vs-long.mp4` and
`public/thumbnails/vowels-short-vs-long.jpg` are committed at 0 bytes (added by
`d5667df chore(public): add placeholder video fixture for seed`). A range
request against an empty file answers `416 Range Not Satisfiable`, so the 11
stories of `PlaybackPositionedVideoPlayer`, `SeekStepMenu` and
`VideoCenterPlayButton` render their controls over a video that can never
decode. Separately, `lesson-view.stories.tsx` points at `/videos/vowels.mp4` and
`/thumbnails/vowels.jpg`, which no file backs at all — four stories 404 twice
each.

**Precedent.** `.storybook/main.ts` already aliases
`@/app/[locale]/learner-actions` to `.storybook/learner-actions-stub.ts`, with a
docblock explaining that the real module is `"use server"`: Next turns its
imports into RPC stubs, but Vite would bundle Drizzle, Better Auth and
`server-only` into the preview. `actions.ts` is the same kind of module and
needs the same seam — it was simply missed.

## Goals / Non-Goals

**Goals:**

- All 462 stories mount without Storybook's error display.
- The 15 video stories load a real frame instead of answering 404 or 416.
- Both failures are caught by `pnpm test:run`, so the next regression does not
  wait for someone to open a browser.
- The seam stays in `.storybook/`; `src/` is not bent to suit the preview.

**Non-Goals:**

- Making `content-locations.ts` or the blob-store layer browser-safe. Their use
  of `node:fs` is correct for the server.
- Changing `actions.ts`, `resolve-continue-watching.ts`, or the
  `useResolvedContinueWatching` default-parameter design. The graph is right for
  Next.js.
- Committing real course video. Fixtures stay tiny stand-ins.
- Touching the four verified false positives (`UI/Dialog`,
  `LessonCompletionMark/NotCompleted`, `VideoBufferingIndicator/Buffering`,
  `ThemeToggle`). All behave correctly.

## Decisions

### D1 — Cut the graph at `actions.ts`, not at `resolve-continue-watching`

Cutting the graph at `actions.ts` is the shallowest cut that removes `node:fs`
while keeping the most real code in the preview: `resolve-continue-watching.ts`
and `use-resolved-continue-watching.ts` stay genuine, so the stories still
exercise the envelope-collapsing logic (`result?.data ?? null`) and the
`none`/`resolving`/`resolved` state machine that they exist to demonstrate.

*Alternatives considered.* Aliasing `resolve-continue-watching` would stub out
the very logic the `Resolving` story is about. Aliasing `use-case-dependencies`
would leave a `"use server"` module in the preview, which the `learner-actions`
docblock already argues against. Adding `node:fs` to Vite's `optimizeDeps` or
shimming it would paper over a server module being in a client bundle rather
than fix it.

### D1a — The seam is a `resolveId` plugin, not a `resolve.alias` entry

**Amended during implementation.** A `resolve.alias` entry for
`@/app/[locale]/actions` was written first, following the `learner-actions`
precedent, and it did not work: the sole importer,
`resolve-continue-watching.ts`, sits in the same directory and imports
`"./actions"`. Vite matches aliases against the **import specifier**, so a
relative specifier never matches a path-shaped alias. The preview kept crashing
with the alias in place — caught by the browser re-run in task 2.2, which is
exactly the risk design.md's "a component test passes while the story still
breaks" entry predicted.

The seam therefore matches the **resolved module path**: a small Vite plugin
whose `resolveId` resolves the specifier normally and, when the result is the
real `actions.ts`, returns the stub instead. That covers `./actions`,
`@/app/[locale]/actions`, and any other spelling a future importer picks.

The plugin is a named factory in `.storybook/stub-server-actions.ts` taking a
map of real module path → stub path, so the `learner-actions` stub can move
behind the same seam later if it ever acquires a relative importer. It is left
on its alias for now: that alias works today, and widening this change to touch
a working seam is out of scope.

*Alternative considered.* A regex alias on `/^\.\/actions$/` would match the one
importer today, but it would also capture any `./actions` module anywhere in the
tree — a trap set for the next person who adds one.

### D2 — The stub returns "nothing to resume"

`actions.ts` exports exactly one value, `findContinueWatchingAction`, plus the
type `ContinueWatchingPanel`. The stub exports a `findContinueWatchingAction`
that resolves to `{ data: null }`.

Every one of the nine stories passes its own `resolve` override, so this return
is never actually read — it exists to satisfy the import. `null` is the honest
default anyway: it is what the real action answers for a learner with nothing
stored, and it matches how `resolveContinueWatchingPanel` collapses every
failure. The stub must not invent a resumable lesson a story did not ask for.

The stub mirrors `learner-actions-stub.ts` in shape and carries a docblock
explaining why it exists, so the next person reads one pattern, not two.

### D3 — Generate the fixtures with `ffmpeg`, check them in

The user chose real, tiny fixtures over re-pointing story paths. A few seconds
of flat colour encodes to a handful of kilobytes — small enough to commit
without argument, real enough that a player can seek in it, which is exactly
what `PlaybackPositionedVideoPlayer`'s resume stories need.

Four files result: `vowels-short-vs-long.mp4` / `.jpg` (replacing the 0-byte
placeholders) and `vowels.mp4` / `vowels.jpg` (new, for the LessonView stories).
The clip needs a real duration — the resume stories seek to 3:00 and to
near-completion — so it is encoded long enough for those seeks to land rather
than clamp to the end.

*Alternative considered.* Re-pointing all 15 stories at one fixture would mean
fewer binaries, but it edits story source to work around missing assets and
loses the distinction between the two lessons the stories name.

### D4 — Assert the fixtures in a test, not just by eye

A 0-byte file is exactly the kind of regression that passes review and fails
silently in the browser. A unit test reads the story sources, extracts every
`/videos/…` and `/thumbnails/…` path, and asserts each one exists and is
non-empty — with an explicit allowlist for
`/videos/a-lesson-that-never-arrives.mp4`, whose absence is the point of
`VideoBufferingIndicator/Buffering`.

### D5 — Assert the stub's surface against the real module

A stub silently drifts when the real module grows an export. A unit test asserts
that every value export of `src/app/[locale]/actions.ts` is also exported by the
stub, so adding an action to the real file fails the suite until the stub keeps
up.

## Testing strategy

TDD per task: the failing test lands before the fix.

| Behaviour | Layer | Where | Mirrors |
| --- | --- | --- | --- |
| The stub exports every value export of the real `actions.ts` | Vitest unit | `.storybook/actions-stub.test.ts` | D5; the export-parity idea is new, so it is written plainly rather than copied |
| The stub's `findContinueWatchingAction` resolves to `{ data: null }` | Vitest unit | `.storybook/actions-stub.test.ts` | `learner-actions-stub`'s envelope shape |
| `.storybook/main.ts` aliases `@/app/[locale]/actions` to the stub | Vitest unit | `.storybook/main.test.ts` | the existing `learner-actions` alias entry |
| Every video/poster path referenced by a story exists and is non-empty | Vitest unit | `src/components/lesson-view/story-media-fixtures.test.ts` | `src/lib/minimal-pair-clips/minimal-pair-clips.test.ts`, which already reads real files off disk with `node:fs` |
| `AchievementsView` and `MyLearningView` mount and render | Vitest component + RTL | existing `achievements-view.test.tsx` / `my-learning-view.test.tsx` | the components already have colocated component tests; extend rather than duplicate |
| The nine stories actually render in a browser | Playwright-driven Storybook sweep | manual re-run of the sweep used to find this | not added to `e2e/` — see the risk below |

Vitest is the right layer for all of it: the crash is a module-resolution
failure, which a component test reproduces by importing the component, and the
fixture check is filesystem I/O. Playwright is not used, per the testing-stack
rule that a case Vitest can cover does not go to Playwright.

Final verification is `pnpm verify` plus a re-run of the 462-story browser sweep
to confirm the findings list comes back empty except the four known false
positives.

## Risks / Trade-offs

- **A component test passes while the story still breaks.** Vitest resolves
  `@/app/[locale]/actions` through `tsconfig`, not through Storybook's Vite
  alias, so a component test would not have caught this crash in the first
  place. → The alias test (D5) covers the wiring, and the browser sweep is
  re-run before the change is called done. The sweep is the real proof.
- **Committed binaries grow the repo.** → Kept to a few KB of flat colour;
  the 15 GB course tree stays outside git, per
  `openspec/specs/course-content-storage/spec.md`.
- **The fixture test hard-codes an allowlist**, so a second deliberate
  missing-fixture story would fail until someone adds it. → Accepted: failing
  loudly on an unknown missing asset is the behaviour worth having, and the
  allowlist entry is one line with a comment.
- **The stub can drift in behaviour, not just in shape.** Export parity does not
  prove the stub returns something sensible. → Mitigated by D2's choice of
  `null`, the state no story depends on, and by every story overriding `resolve`
  anyway.
- **`ffmpeg` is a local tool, not a project dependency.** The fixtures are
  generated once and committed, so nobody needs `ffmpeg` to build or test. → The
  exact command is recorded in `tasks.md` so the fixtures can be regenerated.

## Migration Plan

No migration. Nothing ships to users: the alias affects only the Storybook
preview build, and the fixtures are development assets under `public/` that no
production page references. Rollback is `git revert` of the change.

## Open Questions

None. The one fork — real fixtures versus re-pointing story paths — was put to
the user, who chose real fixtures (D3).
