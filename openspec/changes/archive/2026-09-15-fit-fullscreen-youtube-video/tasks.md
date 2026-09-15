## 1. Fit the video in native fullscreen

- [x] 1.1 Add e2e tests under "GIVEN a browser that can take the player fullscreen" for a 915×412 viewport in fullscreen: the provider is no wider than `height × 16/9` and centred, the embed frame stays centred on it, and the control layout spans the viewport; run them and watch the provider test fail (TDD: test → impl)
- [x] 1.2 Add the `[data-media-player][data-fullscreen] [data-media-provider]` rule to `lesson-video-player.css` with its why-comment; run the new tests green (TDD: test → impl)
- [x] 1.3 Update the `LessonVideoPlayer` JSDoc remarks and the e2e file's spec-coverage list to name the fullscreen case (TDD: n/a — docs for 1.2)

## 2. Verification

- [x] 2.1 Visually check a YouTube lesson in fullscreen under Android landscape emulation with Playwright MCP: full video visible, controls across the screen
- [x] 2.2 Run `pnpm verify` and `e2e/lesson-video-player.spec.ts` on chromium (serial) and confirm green
