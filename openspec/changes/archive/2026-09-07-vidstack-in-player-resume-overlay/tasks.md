## 1. Dependency and locale groundwork

- [x] 1.1 Add `@vidstack/react` to `dependencies` with `pnpm add @vidstack/react` and confirm `pnpm typecheck` still passes on the untouched tree (config-only, no TDD gate — get explicit approval before editing `package.json`).
- [x] 1.2 Read the installed `DefaultLayoutTranslations` type from `node_modules/@vidstack/react` and record its full key list in `design.md` under Open Questions, resolving whether every visible string is reachable.
- [x] 1.3 In `src/messages/{en,es,pt}.json`, rename `Components.NativeVideoPlayer` → `Components.LessonVideoPlayer` and `Components.LessonVideoResumeModal` → `Components.LessonVideoResumeOverlay`, keeping the existing copy verbatim.
- [x] 1.4 In the same three files add `Components.VideoPlayer` with one key per `DefaultLayoutTranslations` entry from 1.2, translated for `es` and `pt` — no key left English outside `en.json`.

## 2. The resume rule (pure logic, unit)

- [x] 2.1 (TDD: test → impl) `use-resume-on-first-play.test.ts`: `handlePlay()` on a non-resumable saved position (`null`, `5s`, and within 10s of the end) never calls `pause()` and leaves `offeredSeconds` at `null`.
- [x] 2.2 (TDD: test → impl) `handlePlay()` on a resumable position calls `player.pause()` exactly once and sets `offeredSeconds` to the saved value.
- [x] 2.3 (TDD: test → impl) `resumeFromSavedPosition()` calls `seekTo(saved)` then `play()`, in that order, and clears `offeredSeconds`.
- [x] 2.4 (TDD: test → impl) `restartFromBeginning()` calls `seekTo(0)` then `play()` and clears `offeredSeconds`.
- [x] 2.5 (TDD: test → impl) One-shot guard: after any of the three outcomes, a second `handlePlay()` does not pause and does not re-open the offer.
- [x] 2.6 (TDD: test → impl) The hook imports `isPositionResumable` for the gate and nothing from `@vidstack/react`; assert the module's import graph stays player-agnostic.
- [x] 2.7 Write the JSDoc contract on the exported hook and its structural `player` type (TypeDoc-visible), per `AGENTS.md`.

## 3. The in-player overlay (component, RTL)

- [x] 3.1 (TDD: test → impl) `lesson-video-resume-overlay.test.tsx`: renders `role="dialog"` with an accessible name from `Components.LessonVideoResumeOverlay.dialogLabel` and a description from `description`.
- [x] 3.2 (TDD: test → impl) Renders "Resume from MM:SS" using `formatMinutesSeconds` for the given `positionSeconds`.
- [x] 3.3 (TDD: test → impl) Clicking Resume calls `onResume`; clicking "Restart from beginning" calls `onRestart`; neither is called on render.
- [x] 3.4 (TDD: test → impl) Pressing `Escape` calls `onRestart` (dismissal is restart, design §D4).
- [x] 3.5 (TDD: test → impl) Focus lands on the Resume action when the overlay appears.
- [x] 3.6 (TDD: test → impl) It renders no backdrop element and sets no `aria-hidden` outside itself — assert the sibling page content stays queryable and unhidden.
- [x] 3.7 Style it to fill and stay within the player box (absolute inset, own z-index, cinema tokens), and add `lesson-video-resume-overlay.stories.tsx` under the `LessonView/` title prefix with `en`/`es` locale stories.

## 4. The Vidstack player component

- [x] 4.1 (TDD: test → impl) `lesson-video-player.test.tsx`: renders with the given `source` and `title`, exposes `ariaLabel` as the player's accessible name, and renders its `children` slot.
- [x] 4.2 (TDD: test → impl) Passes `poster` through when present and omits it when the lesson has none.
- [x] 4.3 (TDD: test → impl) Forwards `keyDisabled` to `<MediaPlayer>` so the caller can suppress shortcuts while the overlay is open (design §D6).
- [x] 4.4 Implement `<MediaPlayer>` + `<MediaProvider>` + `<DefaultVideoLayout icons={defaultLayoutIcons} translations={...}>`, wire the `Components.VideoPlayer` translations map typed as `DefaultLayoutTranslations`, and import the two Vidstack stylesheets.
- [x] 4.5 Map the Default Layout's CSS variables onto the project's cinema tokens (colors, radii, focus ring) in the component's own stylesheet scope — colors only, no re-skin.
- [x] 4.6 Add `lesson-video-player.stories.tsx` (`LessonView/LessonVideoPlayer`), including a story with the resume overlay in its children slot.
- [x] 4.7 Write the component JSDoc, including why the overlay is a `children` slot rather than a prop.

## 5. Rewire the persistence wrapper

- [x] 5.1 (TDD: test → impl) Rewrite `playback-positioned-video-player.test.tsx` against a stubbed player handle: no `setPosition` before the first interaction.
- [x] 5.2 (TDD: test → impl) Debounced `time-update` writes stay within the 1000–2000ms window (at most three writes across a 5s burst).
- [x] 5.3 (TDD: test → impl) `pause`, `seeking`, and `ended` each write immediately, bypassing the debounce.
- [x] 5.4 (TDD: test → impl) Unmount flushes a pending debounced write; `beforeunload` writes the latest position.
- [x] 5.5 (TDD: test → impl) Nothing is read from storage into a prompt on mount — the overlay is absent until `handlePlay` runs.
- [x] 5.6 (TDD: test → impl) Answering the overlay opens the write gate, so positions persist from that point on.
- [x] 5.7 Implement: hold a `MediaPlayerInstance` ref, build the structural player handle from it, subscribe the lifecycle callbacks on `<MediaPlayer>`, and render `LessonVideoResumeOverlay` into the player's children when `offeredSeconds !== null`.
- [x] 5.8 Update the component JSDoc to describe the first-play trigger and delete the mount-time/`NiceModal` prose that no longer holds.

## 6. Wire into the Lesson Page and delete the old surfaces

- [x] 6.1 (TDD: test → impl) `lesson-view.test.tsx`: the gold title cover still renders only for poster-less lessons before playback and is retired on the first play (existing behavior, re-asserted against the new player).
- [x] 6.2 Point `lesson-view.tsx` at the renamed `Components.LessonVideoPlayer` namespace and keep the `onPlaybackStart` latch intact.
- [x] 6.3 Delete `src/components/lesson-view/native-video-player/` (component, test, story) and `src/components/modals/lesson-video-resume-modal/` (component, test, story); update `src/components/lesson-view/index.ts` and any barrel or story references.
- [x] 6.4 Grep the tree for `NativeVideoPlayer`, `LessonVideoResumeModal`, and the old message namespaces to confirm no references survive.

## 7. End-to-end

- [x] 7.1 (TDD: test → impl) Rewrite `e2e/lesson-playback-resume.spec.ts`: landing on a lesson with a resumable position shows no resume surface anywhere in the document.
- [x] 7.2 (TDD: test → impl) Pressing play pauses the video and shows the overlay, and the overlay's bounding box sits inside the player's bounding box.
- [x] 7.3 (TDD: test → impl) Resume seeks to the stored position and the video is playing afterwards; Restart and `Escape` each land at `0` and playing.
- [x] 7.4 (TDD: test → impl) A second play after answering does not reopen the overlay.
- [x] 7.5 (TDD: test → impl) The three negative threshold cases (`null`, trivial, near-complete) play straight through with no overlay, and cold load still writes nothing before interaction.
- [x] 7.6 (TDD: test → impl) The page behind the player stays interactive while the overlay is open (a sidebar control is clickable, nothing is `aria-hidden`).

## 8. Verification

- [x] 8.1 Run `pnpm test:run` — all Vitest unit and component suites green.
- [x] 8.2 Run `pnpm test:e2e` for the lesson-playback flows across the configured browsers.
- [x] 8.3 Run `pnpm verify` (typecheck, format check, lint, tests) and fix anything it reports.
- [x] 8.4 Visual review in Storybook and in the running app with Playwright MCP: overlay inside the player, both locales, dark theme, and the Default Layout's localized control labels.
