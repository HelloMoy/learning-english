## 1. Copy

- [x] 1.1 Add `Components.SwipeUpHint.message` and `Components.SwipeUpHint.dismiss` to `src/messages/en.json`, `es.json` and `pt.json` (no code depends on them yet; a missing locale would surface as a raw key in the stories)

## 2. The enlarged mode stops locking the page (hook)

- [x] 2.1 In `use-enlarged-video.test.ts`, replace the "page behind it" block: entering the mode leaves `document.body.style.overflow` untouched, and a pre-existing value is left alone (TDD: test → impl — red today because the hook writes `hidden`)
- [x] 2.2 Remove the `overflow` effect from `useEnlargedVideo`; run the hook tests green (TDD: test → impl)
- [x] 2.3 Add hook tests for the scroll offset: `window.scrollY` at entry is restored via `window.scrollTo` on `exit`/`toggle`-off, nothing is called when the mode was never entered, and nothing is called on unmount while enlarged (TDD: test → impl)
- [x] 2.4 Implement the capture-and-restore in `useEnlargedVideo`; rewrite its JSDoc (`@remarks`) to describe gesture pass-through and the restore instead of the lock (TDD: test → impl)

## 3. The viewport-vs-screen inference (hook)

- [x] 3.1 Write `src/hooks/use-browser-chrome-visible/use-browser-chrome-visible.test.ts` with jsdom stubs for `matchMedia("(pointer: coarse)")`, `matchMedia("(orientation: landscape)")`, `screen.width/height` and `innerHeight`: true only for coarse pointer + landscape + `innerHeight < min(screen)`; false for each condition off; flips after a dispatched `resize` (TDD: test → impl)
- [x] 3.2 Implement `useBrowserChromeVisible` as a `useSyncExternalStore` over `resize`, `orientationchange` and `visualViewport` `resize`, with a `false` server snapshot; JSDoc with `@remarks` on the inference and `@category Hooks` (TDD: test → impl)

## 4. The hint (component)

- [x] 4.1 Write `src/components/lesson-view/swipe-up-hint/swipe-up-hint.test.tsx` (mocked `next-intl`, Spanish copy): renders the message with `role="status"`, the dismiss button carries the localized label, activating it removes the hint, the wrapper does not intercept pointer events (TDD: test → impl)
- [x] 4.2 Implement `SwipeUpHint` — `absolute inset-x-0 top-3 z-20 pointer-events-none` wrapper, pill with the message, `lucide-react` `X` dismiss button with `pointer-events-auto`, local `dismissed` state; JSDoc per the project's component rules (TDD: test → impl)
- [x] 4.3 Add `swipe-up-hint.stories.tsx` under `LessonView/SwipeUpHint` with default, `es` and `pt` stories against a dark 16:9 stand-in; check the three locales in Storybook with Playwright MCP

## 5. Wiring into the player (component)

- [x] 5.1 In `lesson-video-player.test.tsx`, assert no `role="status"` hint is rendered while the video is in the page (TDD: test → impl)
- [x] 5.2 Render `<SwipeUpHint>` inside `<MediaPlayer>` when `isEnlarged && useBrowserChromeVisible()`; rewrite the "Enlarged, the player is pinned…" paragraph of the `LessonVideoPlayer` JSDoc to drop the scroll lock and describe the gesture and the hint (TDD: test → impl)

## 6. End to end

- [x] 6.1 In `e2e/lesson-video-player.spec.ts`, invert the "page stops scrolling" test: while enlarged, `body` has no `overflow: hidden` and `window.scrollBy` moves `scrollY` (TDD: test → impl — red until 2.2 lands)
- [x] 6.2 Add "leaving the mode restores the scroll offset": scroll by script while enlarged, exit, assert `scrollY` equals the offset at entry
- [x] 6.3 Add a describe with `test.use({ ...IPHONE, viewport: { width: 874, height: 292 }, contextOptions: { screen: { width: 402, height: 874 } } })`: the hint appears after enlarging, disappears after `page.setViewportSize({ width: 874, height: 402 })`, and can be dismissed; not shown before enlarging
- [x] 6.4 Run `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts` on all three projects (`PLAYWRIGHT_BASE_URL` per the machine notes) and fix what fails

## 7. Manual verification on the iOS 26.5 simulator

- [x] 7.1 Enlarge in portrait, rotate to landscape: the hint is visible over the video, a swipe up hides Safari's toolbar, the box reaches the full 402pt height and the hint is gone
- [x] 7.2 Rotate first, enlarge second (the learner's original sequence) still reaches the full height; exiting the mode returns the page to the offset it had at entry
- [x] 7.3 Record both runs (screenshots via `xcrun simctl io <udid> screenshot`) in the change's verification notes

## 8. Verification

- [x] 8.1 Walk the `clean-code` checklist over the new hook, the component and the edited hook (names, single responsibility, argument count, comments explain why)
- [x] 8.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts`; fix every failure before declaring the change done
