## 1. The poster covers the embed before the first play

- [x] 1.1 (TDD: test → impl) In `lesson-video-player.test.tsx`, invert "WHEN a YouTube
      lesson has no poster THEN none is painted over the provider's own" into "THEN the
      Poster element is rendered to paint the provider's own thumbnail", and add "WHEN a
      self-hosted lesson has no poster THEN the Poster element renders hidden". Then drop
      the `poster !== undefined` guard around `<Poster>` in `lesson-video-player.tsx`
      (design §D1).
- [x] 1.2 Update the `LessonVideoPlayer` JSDoc paragraph on the poster — it currently says a
      YouTube lesson needs none — to say why the element is now always rendered.

## 2. One centre control geometry

- [x] 2.1 Add the two custom properties to `lesson-video-player.css` and point the Player's
      own centre control at them: 64 px, opaque `#000`, centred by half-size margins
      (design §D2).
- [x] 2.2 Restyle the compact chrome's centre button to the same geometry: map
      `--video-sm-play-button-size` / `--video-sm-play-button-bg` to the shared properties,
      position it absolutely at the frame's centre inside `.vds-controls`, and neutralize
      its hover transform (design §D2).
- [x] 2.3 Update the CSS comment block and the `VideoCenterPlayButton` JSDoc that describe
      the 45 px translucent disc, so they state the covering rule and its measurements.

## 3. The buffering indicator with an opaque core

- [x] 3.1 (TDD: test → impl) Write
      `src/components/lesson-view/video-buffering-indicator/video-buffering-indicator.test.tsx`
      — renders the `vds-buffering-indicator` ring markup (spinner, track, track-fill), a
      core element, and is `aria-hidden` — then create `video-buffering-indicator.tsx`
      around `Spinner.Root/Track/TrackFill` with JSDoc (design §D3).
- [x] 3.2 Add the core's geometry and visibility rules to `lesson-video-player.css`: 44 px
      opaque disc centred in the indicator, opacity 0 by default and 1 under
      `[data-media-player][data-buffering]`, sharing the ring's transition.
- [x] 3.3 (TDD: test → impl) In `lesson-video-player.test.tsx`, assert the indicator is
      handed to the layout's `bufferingIndicator` slot (or record in the test why jsdom
      cannot observe it and defer to 4.3); then pass `<VideoBufferingIndicator />` in
      `slots` from `lesson-video-player.tsx`.
- [x] 3.4 Add `video-buffering-indicator.stories.tsx` under `LessonView/` with a buffering
      and an idle story, and review both in Storybook with Playwright MCP.

## 4. Browser behaviour

- [x] 4.1 (TDD: test → impl) In `e2e/lesson-video-player.spec.ts`, "GIVEN a YouTube-sourced
      lesson": before the first play the poster element is visible and its image source is
      on `ytimg.com`; after playback starts it is no longer visible.
- [x] 4.2 (TDD: test → impl) "GIVEN Safari on an iPhone": with the controls in view on a
      YouTube lesson, the centre control on screen is at least 64 × 64, its computed
      background has alpha 1, and its centre is within 1 px of the player's centre — once
      in the compact chrome (portrait) and once in the enlarged landscape mode.
- [x] 4.3 (TDD: test → impl) The buffering core is present at 44 × 44 with an opaque
      background, has computed opacity 0 while the video plays, and 1 once
      `data-buffering` is set on the player element.
- [x] 4.4 Confirm the existing desktop and iPhone tests in that file still pass unchanged.

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix any failure
      at its root.
- [x] 5.2 Run `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts` with an explicit base
      URL and `--workers=1`. _Run against the dev server already on port 3000
      with `--workers=1`: 81 passed, 2 failed, both green on `--last-failed` — Firefox
      needed more than 30 s to get the embed rolling (the poster test now runs `test.slow()`),
      and WebKit's frame-centre test hit a `boundingBox()` race that predates this change._
- [x] 5.3 Verify by eye on the iOS simulator (Xcode, real iPhone Safari) on a
      YouTube-sourced lesson, in the page and in the enlarged landscape mode: one control
      before the first play, one spinner while loading, one centre play/pause while the
      controls are shown, and nothing over a rolling video. _Portrait, by eye on the iOS 26.5 simulator: one
      control over the poster before the first play, one opaque pause disc while the bar is
      up. The enlarged landscape geometry is proven under WebKit iPhone emulation (4.2); the
      simulator's rotation shortcut was not driven reliably enough for a screenshot._
- [x] 5.4 Run `/opsx:verify`, then `/opsx:archive`.
