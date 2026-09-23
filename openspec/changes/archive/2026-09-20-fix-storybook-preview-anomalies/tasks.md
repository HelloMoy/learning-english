## 1. Stop the preview from reaching `node:fs`

- [x] 1.1 (TDD: test → impl) Write `.storybook/actions-stub.test.ts` asserting
  that `findContinueWatchingAction` from the stub resolves to `{ data: null }`.
  Red: the stub does not exist yet.
- [x] 1.2 (TDD: test → impl) Extend the same test with export parity — every
  **value** export of `src/app/[locale]/actions.ts` is also exported by the stub.
  Today that is exactly `findContinueWatchingAction`. Red on the missing stub.
- [x] 1.3 (TDD: impl for 1.1–1.2) Create `.storybook/actions-stub.ts`, mirroring
  the shape and docblock style of `.storybook/learner-actions-stub.ts`: explain
  that the real module is `"use server"` and that Vite would otherwise bundle
  `use-case-dependencies` → `create-content-blob-store` → `content-locations` →
  `node:fs` into the preview. Green.
- [x] 1.4 (TDD: test → impl) Write `.storybook/main.test.ts` asserting that the
  resolved Vite config aliases `@/app/[locale]/actions` to the stub, and that it
  is ordered **before** the bare `@` alias — the same ordering constraint the
  `learner-actions` entry already documents. Red.
- [x] 1.5 (TDD: impl for 1.4) Add the alias entry to `viteFinal` in
  `.storybook/main.ts`, beside the existing `learner-actions` line. Green.

## 2. Prove the nine stories mount

- [x] 2.1 Confirm both components already mount across every story state.
  **Deviation:** no new cases were added. The colocated
  `achievements-view.test.tsx` and `my-learning-view.test.tsx` already hold 30
  passing tests that render each component through `renderInLocale` across the
  same states the stories cover (nothing watched, unresolved, resolved, empty
  catalog). Adding "it mounts" duplicates would restate existing assertions, so
  the existing suite is the coverage this task asked for.
- [x] 2.2 Re-run the browser sweep for the nine story ids
  (`components-achievementsview--*`, `components-mylearningview--*`) against a
  clean Storybook and confirm Storybook's error display is gone and no
  `node:fs` error reaches the console. This is the step that actually proves
  task group 1 — see design.md's first risk.

## 2b. Give the preview a `nuqs` adapter (discovered in 2.2)

- [x] 2b.1 (TDD: test → impl) Write a failing test asserting the preview's
  decorator stack wraps a story in a `nuqs` adapter, so a component calling
  `useQueryState` renders instead of throwing
  `nuqs requires an adapter to work with your framework`.
- [x] 2b.2 (TDD: impl for 2b.1) Add the adapter to `.storybook/preview.tsx`,
  using `NuqsTestingAdapter` from `nuqs/adapters/testing` with `hasMemory: true`
  so a story's own writes read back. Green.
- [x] 2b.3 Re-run the four `components-achievementsview--*` stories in the
  browser and confirm they render with no console error.

## 3. Make the video fixtures real

- [x] 3.1 (TDD: test → impl) Write
  `src/components/story-media-fixtures.test.ts` (kept at the `components/` root
  rather than under `lesson-view/`, since it reads every component's stories): read every
  `*.stories.tsx` under `src/components/`, extract each `/videos/…` and
  `/thumbnails/…` path, and assert each backing file exists and is larger than
  zero bytes. Allowlist `/videos/a-lesson-that-never-arrives.mp4` with a comment
  naming `VideoBufferingIndicator/Buffering` as the reason. Mirror
  `src/lib/minimal-pair-clips/minimal-pair-clips.test.ts` for reading real files
  off disk. Red on four paths: two missing, two at 0 bytes.
- [x] 3.2 (TDD: impl for 3.1) Generate the clip and poster with `ffmpeg`.
  The stories declare `durationSeconds: 600` and seek to 180s and to
  near-completion, so the clip runs the full 10 minutes. A slow hue drift over
  a flat colour keeps it seekable at 292 KB; `testsrc2` was tried first and cost
  6.5 MB, and `drawtext` is not compiled into the local ffmpeg. Commands:

  ```bash
  ffmpeg -y -f lavfi -i "color=c=0x1b2a4a:s=480x270:r=2:d=600" \
    -vf "hue=H=t*0.6" \
    -c:v libx264 -preset veryslow -crf 34 -g 20 -pix_fmt yuv420p \
    -movflags +faststart fixture.mp4
  ffmpeg -y -ss 12 -i fixture.mp4 -frames:v 1 -q:v 6 fixture.jpg
  ```
- [x] 3.3 (TDD: impl for 3.1) Replace the 0-byte
  `public/videos/vowels-short-vs-long.mp4` and
  `public/thumbnails/vowels-short-vs-long.jpg`; add
  `public/videos/vowels.mp4` and `public/thumbnails/vowels.jpg`. Green.
- [x] 3.4 Re-run the browser sweep for the 15 affected story ids
  (`lessonview-lessonview--*`, `lessonview-playbackpositionedvideoplayer--*`,
  `lessonview-seekstepmenu--*`, `lessonview-videocenterplaybutton--*`) and
  confirm no 404 or 416 on a video or poster, and that a frame decodes.

## 4. Verification

- [x] 4.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix
  any failure at its root cause — no `@ts-ignore`, no rule disabling.
- [x] 4.2 Re-run the full 462-story browser sweep against a clean Storybook and
  confirm the findings list is empty except the four known false-positive
  classes (9 story entries):
  `UI/Dialog` (×3, Radix portal), `LessonCompletionMark/NotCompleted` (renders
  `null` by design), `VideoBufferingIndicator/Buffering` (its 404 is the point),
  and `ThemeToggle` (×4, documented `next-themes@0.4.6` script-tag warning).
- [x] 4.3 `pnpm test:e2e` is **not** run for this change: nothing under `e2e/`
  is touched and no product behaviour changes. Note it here rather than skip it
  silently.
