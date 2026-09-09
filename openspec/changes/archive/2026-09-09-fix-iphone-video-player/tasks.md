## 1. Copy for the enlarge control

- [x] 1.1 No new copy needed: `Components.VideoPlayer` already carries
      `enter-fullscreen` and `exit-fullscreen`, translated in `en`, `es` and `pt`
      ("Pantalla completa" / "Salir de pantalla completa", "Tela cheia" / "Sair da tela
      cheia"). The enlarge control reuses those keys, so the app keeps one vocabulary for
      the action and no locale gains a raw key

## 2. The mode's rule, as a hook

- [x] 2.1 (TDD: test → impl) `use-enlarged-video.test.ts`: the hook starts collapsed,
      `toggle` enters and leaves the mode, and `exit` is a no-op while collapsed →
      implement `src/hooks/use-enlarged-video/use-enlarged-video.ts` returning
      `{ isEnlarged, toggle, exit }`
- [x] 2.2 (TDD: test → impl) same file: pressing `Escape` while enlarged leaves the mode,
      and pressing it while collapsed changes nothing → add the key listener
- [x] 2.3 (TDD: test → impl) same file: the body does not scroll while enlarged, scrolls
      again after leaving, and is restored when the hook unmounts mid-mode → add the
      scroll lock with its cleanup
- [x] 2.4 Add JSDoc to the hook covering its return value and why the mode is state here
      rather than in the player component

## 3. The enlarge button

- [x] 3.1 (TDD: test → impl) `video-enlarge-button.test.tsx`: the button's accessible
      name comes from `Components.VideoPlayer`, it announces whether the mode is active,
      and pressing it invokes the callback → implement
      `src/components/lesson-view/video-enlarge-button/video-enlarge-button.tsx`
- [x] 3.2 (TDD: test → impl) same file: the name and the pressed state both change when
      the mode is active → finish the two-state rendering
- [x] 3.3 Add JSDoc to the component and its props
- [x] 3.4 Add `video-enlarge-button.stories.tsx` under the `LessonView/` title prefix,
      with a collapsed story, an enlarged story, and a non-`en` locale story

## 4. Wiring the button into the player

- [x] 4.1 Pass `slots={{ fullscreenButton: … }}` to `DefaultVideoLayout`. **The RTL
      assertions moved to Playwright** (task 5.4): the Default Layout renders no controls
      at all under jsdom — the player defers loading behind an `IntersectionObserver`
      that never fires, so `.vds-video-layout` is empty and the slot never mounts. See
      design.md § Testing strategy
- [x] 4.2 (TDD: test → impl) `lesson-video-player.test.tsx`: the collapsed player is a
      full-width 16:9 box and is not pinned → apply the enlarged state as a class on the
      existing player element, never a portal. Element identity across the toggle is
      asserted in the e2e spec, where the control exists to press
- [x] 4.3 Enlarged treatment added to `lesson-video-player.css` as
      `[data-media-player].lesson-video-player--enlarged`. Tailwind utilities were tried
      first and lost: Vidstack's `[data-media-player] { position: relative; width: 100% }`
      ties `.fixed` / `.w-dvw` on specificity and loads after them, so the player never
      left the page. The box is the largest 16:9 that fits, over a black backdrop —
      stretching it to a landscape viewport would crop the embed's middle band
- [x] 4.4 Update the `LessonVideoPlayer` JSDoc: the fullscreen slot replacement and why
      the library's button cannot serve iPhone

## 5. The out-of-flow embed frame

- [x] 5.1 (TDD: test → impl) `e2e/lesson-video-player.spec.ts`: on a lesson page, the
      provider's `iframe.vds-youtube` has computed `position: absolute` — red first,
      because it was `static` → added the override to `lesson-video-player.css`
- [x] 5.2 (TDD: test → impl) same spec: the element wrapping the player is no taller than
      the player's own box plus its borders. Red first at 369px against a 363px bound —
      the player is an inline-level flex box and was sitting on the text baseline, adding
      ~6px of descender space inside a black wrapper → `align-bottom` on the player
- [x] 5.4 (moved from 4.1/4.2) same spec: the enlarge control is in the chrome and the
      library's fullscreen button is gone, pressing it fills the viewport and stops the
      page scrolling, `Escape` returns the video to the page, and the player element is
      never replaced across the toggle. Green on chromium, firefox and webkit
- [x] 5.3 Confirmed on chromium, firefox, webkit and the iOS Simulator: the visible band
      is still the middle of the embed and YouTube's own chrome stays outside the 16:9
      frame. The override moves the frame, it does not resize it

## 7. The fallback is a fallback (added after review)

- [x] 7.1 (TDD: test → impl) `video-enlarge-button.test.tsx`: the control renders nothing
      while the player reports `canFullscreen`, and it asks for that capability rather
      than for the platform → `useMediaState("canFullscreen")` gate in the component
- [x] 7.2 Move the slot from `fullscreenButton` to `afterFullscreenButton`, so the
      library's own button stays in the chrome and keeps serving every browser that has
      the Fullscreen API
- [x] 7.3 (TDD: test → impl) `e2e/lesson-video-player.spec.ts`: split into two branches —
      desktop chromium/firefox/webkit assert the library's button is the affordance and
      the fallback is absent; a new iPhone-emulated describe asserts the mirror image
- [x] 7.4 The iPhone branch needed real interaction to be assertable: desktop WebKit
      reports fullscreen support, so `devices["iPhone 13"]` is what selects the branch,
      and the compact layout keeps its control bar `visibility: hidden` until playback
      has started, then auto-hides it ~2s later — so the helper plays, waits for
      `data-started`, and pauses, because a paused player keeps its controls up

## 8. Centring regression (found in review on a real iPhone)

- [x] 8.1 The first override centred the frame with `top: 50%` +
      `translateY(-50%)`. On a real iPhone that made the visible band slide off the video
      after a resume seek — the learner saw a slice of the frame with YouTube's own
      chrome in it. The transform resolves its percentage against the frame's **own used
      height**, and WebKit for iOS sizes an iframe from its content rather than its CSS
      height, so the two disagree the moment the embed re-lays itself out
- [x] 8.2 Replaced with the geometry that was actually measured on iOS 26.5 during the
      diagnosis: `top: -450%` on the `[data-no-controls]` case (`-450% + 1000%/2 = 50%`),
      `top: 0` otherwise, no transform. Both percentages resolve against the provider, so
      nothing depends on the frame's own height
- [x] 8.3 Added an e2e assertion that pins the invariant rather than the arithmetic: the
      frame's centre sits on the visible band's centre, within a pixel. It cannot be red
      on desktop — no desktop engine ever mis-centred — so it is a guard, not a
      reproduction
- [x] 8.4 Confirmed on a real iPhone by the project owner: the resume seek no longer
      slides the band. The Simulator could not run the flow — it needs taps, and
      synthetic taps need macOS Accessibility permission this session does not have — but
      the static page was re-verified there: video correctly framed, no slab, no YouTube
      chrome

## 6. Verification

- [x] 6.1 `pnpm verify` green: typecheck, `prettier --check`, `eslint`, and 1240 Vitest
      tests across 140 files. The six "Could not parse CSS stylesheet" lines were traced
      to `src/app/globals.css` (Tailwind 4 syntax jsdom cannot read) and predate this
      change — importing the player's own stylesheet alone produces none
- [x] 6.2 `npx playwright test e2e/lesson-video-player.spec.ts --workers=1` — 18 passed
      across chromium, firefox and webkit. The dev server ran on port 3000, which the
      Playwright config manages itself; Docker/Open WebUI was not occupying it
- [x] 6.3 iOS 26.5 Simulator plus a real iPhone. **Layout:**
      Before: the wrapper measured **1198px** against a 216px player, and the lesson title
      sat below a black slab that took more than a full viewport of scrolling to pass.
      After: the video ends at ~383 CSS px and the title follows ~24px later, the notes
      are on screen without scrolling. **The enlarge control:** verified on the owner's
      own iPhone — the control is in the chrome and the enlarged mode renders, evidenced
      by a landscape capture of the pinned player. It could not be exercised on the
      Simulator, where the compact layout keeps the chrome hidden until a tap and
      synthetic taps need macOS Accessibility permission this session does not have
      (`cliclick` moves the pointer, the click is refused, System Events returns -25204)
- [x] 6.4 177 e2e tests green across chromium, firefox and webkit for
      `lesson-page`, `lesson-playback-resume`, `hosted-lesson-playback`,
      `mobile-viewport` and `watch-progress` — the resume overlay, the position writes,
      the gold title cover and the 320/390px viewport fit are all unchanged
