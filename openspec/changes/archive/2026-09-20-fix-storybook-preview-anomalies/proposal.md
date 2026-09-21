## Why

A full browser sweep of all 462 stories on a clean Storybook instance found two
classes of story that do not work. Nine stories never render at all — they show
Storybook's red error screen because the preview bundle drags `node:fs` into the
browser. Fifteen more render their chrome but can never show a video frame,
because the fixtures they point at are either missing or committed as 0-byte
files. Storybook is the project's stated place for isolated component review and
visual checks, so a story that cannot render is a review surface that silently
lies about the component's state.

## What Changes

- **Stop the preview bundle from reaching `node:fs`.** `AchievementsView` (4
  stories) and `MyLearningView` (5 stories) crash because
  `useResolvedContinueWatching` imports `src/app/[locale]/resolve-continue-watching.ts`
  as a value, which imports `src/app/[locale]/actions.ts`, which pulls
  `use-case-dependencies` → `create-content-blob-store` → `content-locations` →
  `node:fs`. Give the preview a browser-safe stand-in for that server module,
  following the precedent already set by `.storybook/learner-actions-stub.ts`.
- **Give the preview a `nuqs` adapter.** *(Discovered during implementation.)*
  With the `node:fs` crash cleared, the four `AchievementsView` stories failed on
  a second error the first one had masked: `[nuqs] nuqs requires an adapter to
  work with your framework`. The app mounts `NuqsAdapter` in
  `src/components/global-providers.tsx`, but the Storybook preview wraps stories
  in neither that nor any adapter of its own, so the one component using
  `useQueryState` cannot render in isolation.
- **Make the video fixtures real.** `public/videos/vowels-short-vs-long.mp4` and
  `public/thumbnails/vowels-short-vs-long.jpg` are committed at 0 bytes, so every
  player story answers a range request with `416 Range Not Satisfiable`. Replace
  them with a genuine, tiny clip and poster.
- **Create the fixtures the LessonView stories already reference.**
  `lesson-view.stories.tsx` points at `/videos/vowels.mp4` and
  `/thumbnails/vowels.jpg`, neither of which exists — four stories 404 on both.
- **Cover both with tests**, so a story that stops rendering, or a fixture that
  regresses to 0 bytes, fails `pnpm test:run` rather than waiting for someone to
  open the browser.

## Capabilities

### New Capabilities

- `storybook-preview-integrity`: what the Storybook preview guarantees for every
  story — that it mounts without a module-resolution error, that server-only
  modules are stubbed rather than bundled, and that the media fixtures stories
  reference exist and are playable.

### Modified Capabilities

<!-- None. No product behaviour changes: the app's runtime imports, components
     and rendered output are untouched. This change is confined to the Storybook
     preview's module graph and to test fixtures under `public/`. -->

## Impact

- `.storybook/main.ts` — one more `resolve.alias` entry for the server module.
- `.storybook/` — a new browser-safe stub module beside `learner-actions-stub.ts`.
- `public/videos/vowels-short-vs-long.mp4`, `public/thumbnails/vowels-short-vs-long.jpg`
  — replaced, 0 bytes → real content.
- `public/videos/vowels.mp4`, `public/thumbnails/vowels.jpg` — added.
- New tests asserting the alias is wired and the fixtures are non-empty.
- No change to `src/` component source, to the app's runtime module graph, or to
  any rendered output. The nine crashing stories are expected to render after
  this change; the fifteen video stories are expected to load a real frame.

## Non-goals

- **Not** reworking `content-locations.ts`, `create-content-blob-store.ts` or
  `use-case-dependencies.ts` to be browser-safe. The server-side layering is
  correct; only the Storybook preview needs a seam.
- **Not** changing `resolve-continue-watching.ts`, `actions.ts` or the
  `useResolvedContinueWatching` hook. Their import graph is right for Next.js;
  the fix belongs in the Storybook build, not in `src/`.
- **Not** adding real course video to the repo. The fixtures stay deliberately
  tiny stand-ins — the 15 GB course tree keeps living outside git.
- **Not** addressing the four verified false positives from the sweep: `UI/Dialog`
  (renders through a Radix portal), `LessonCompletionMark/NotCompleted` (returns
  `null` by design), `VideoBufferingIndicator/Buffering` (its 404 is the point of
  the story), and `ThemeToggle`'s documented `next-themes@0.4.6` script-tag
  warning. All four behave correctly.
- **Not** fixing the developer's stale Storybook processes on ports 6006/6007.
  That is local machine state, not a repo defect.
