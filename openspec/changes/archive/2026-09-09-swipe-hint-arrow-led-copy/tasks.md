## 1. Copy

- [x] 1.1 Rewrite `Components.SwipeUpHint.message` in `src/messages/{en,es,pt}.json` to the
      short, direction-free line from `design.md`, and add
      `Components.SwipeUpHint.screenReaderMessage` with the directional sentence in all
      three locales. (No TDD ordering: message files are data, and the tests in §2–3 are
      what pin their use.)

## 2. The hint's copy and layout

- [x] 2.1 (TDD: test → impl) `swipe-up-hint.test.tsx`: the status region announces the
      directional `screenReaderMessage`, and the short visible line is `aria-hidden` so it
      is not announced alongside it. Then split the copy into an `aria-hidden` visible span
      and an `sr-only` span in `swipe-up-hint.tsx`.
- [x] 2.2 (TDD: test → impl) `swipe-up-hint.test.tsx`: the visible line holds one line —
      it carries `whitespace-nowrap`. Then add the utility.
- [x] 2.3 Update the `MESSAGES` map in `swipe-up-hint.test.tsx` to the new Spanish copy,
      and confirm the untouched dismissal and `pointer-events` tests still pass unchanged.

## 3. The motion

- [x] 3.1 (TDD: test → impl) `swipe-up-hint.test.tsx`: the pill enters from the top edge
      and that entrance stops under reduced motion — it carries
      `animate-in fade-in slide-in-from-top-2` and `motion-reduce:animate-none`. Then apply
      the utilities in `swipe-up-hint.tsx`.
- [x] 3.2 (TDD: test → impl) `swipe-up-hint.test.tsx`: the arrow animates, stops itself
      after a bounded run, and stills under reduced motion — the glyph carries
      `animate-bounce`, `repeat-[4.5]` and `motion-reduce:animate-none`,
      and stays `aria-hidden`. Then apply the utilities to the existing `ArrowUp`.
- [x] 3.3 Comment the `4.5` at its use site: a whole number of `bounce` iterations ends
      held at `translateY(-25%)` and snaps back on the last frame; the half-iteration lands
      on the resting keyframe instead. Without it the number reads as a typo.

## 4. Documentation and stories

- [x] 4.1 Rewrite the `SwipeUpHint` JSDoc so it explains *why* the direction lives in the
      arrow and the words live in the `sr-only` sentence — the reason a future reader would
      otherwise "fix" by putting "arriba" back in the visible copy.
- [x] 4.2 Refresh the story docstrings that describe the old sentence, and note in the
      meta docstring that a story remounts on every args change — that is how the entrance
      and the bounce get replayed in review. **No reduced-motion story:** `motion-reduce:`
      is a media query, nothing Storybook sets per story reaches it, and Chromatic (whose
      `prefersReducedMotion` parameter would) is not configured in this project, so such a
      story would render identically to `Default` while claiming otherwise. The guarantee
      stays pinned by the component test and checked in the browser's emulation in 5.4.

## 5. Turning the cue from the finger to the page

The hint first shipped with an upward arrow, faithful to the finger. On an iPhone the page
scrolls **down** while the finger travels **up**, and the upward arrow was still being read
against the wrong axis. The arrow now means the page, which forces the verb to mean the
page too.

- [x] 5.1 (TDD: test → impl) Rewrite `Components.SwipeUpHint` as `Components.ScrollDownHint`
      in `src/messages/{en,es,pt}.json`, with a scrolling verb and no direction word:
      `Scroll for full screen` / `Baja para pantalla completa` / `Role para tela cheia`,
      and `screenReaderMessage` naming *down*.
- [x] 5.2 (TDD: test → impl) Point the arrow and its travel downward: `rotate-180` on the
      `ArrowUp`, which turns the glyph over **and** turns `bounce`'s upward travel into a
      downward one. Comment why one utility does both, and why it only works while
      Tailwind v4 emits the standalone `rotate` property rather than a `transform`.
- [x] 5.3 Rename the component and its folder to `ScrollDownHint` /
      `src/components/lesson-view/scroll-down-hint/`, moving the test and the stories with
      it, and update the import in `lesson-video-player.tsx` and the story `title`.
- [x] 5.4 Rewrite the JSDoc and the story docstrings around the new rule: the arrow shows
      where the *page* goes, the verb agrees with it, and putting a swipe verb back beside
      a downward arrow would tell the finger to travel the wrong way.

## 6. Verification

- [x] 6.1 Point `e2e/lesson-video-player.spec.ts` at the renamed namespace — it reads its
      expectations from `src/messages/en.json`, so the namespace rename is the only edit it
      needs.
- [x] 6.2 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`).
- [x] 6.3 Run `pnpm test:e2e --project=webkit e2e/lesson-video-player.spec.ts` against a
      running server (`PLAYWRIGHT_BASE_URL`, `--workers=1`).
- [x] 6.4 Look at the hint in Storybook with Playwright MCP in `en`, `es`, and `pt`, and in
      the enlarged player on the iOS simulator, before calling this done. Watch specifically
      for the last beat of the bounce: the arrow must settle, not twitch.

## 7. Taking the direction out of the stylesheet

Found on a real iPhone: the device picked up the new JS and kept a cached stylesheet, so it
drew the new copy beside an upward arrow. `.rotate-180` was new to the whole codebase, so
the old stylesheet had no such rule and the glyph — an `ArrowUp` — stayed as drawn. The
direction cannot live in a class.

- [x] 7.1 (TDD: test → impl) Swap the glyph to `ArrowDown` so the arrow points down in the
      markup, with no rotation involved, and assert it by the rendered path rather than by
      a class.
- [x] 7.2 (TDD: test → impl) Replace `animate-bounce` + `rotate-180` with an `arrow-drop`
      keyframe in `src/app/globals.css` that travels downward, keeping `repeat-[4.5]` and
      `motion-reduce:animate-none`.
- [x] 7.3 Rewrite the JSDoc and the use-site comment: the glyph carries the direction, CSS
      carries only the motion, and a missing stylesheet must degrade to a still arrow
      pointing the right way — never to a wrong one.
- [x] 7.4 Re-run `pnpm verify`, then validate in real iOS Safari on the simulator via
      `safaridriver`, asserting the arrowhead sits below the shaft.

## 8. Making the travel visible

Measured on the simulator: the arrow moved, and moved **4 px** — `translateY(25%)` of a
16px glyph — for 4.4 seconds. Technically animated, effectively invisible on a phone,
which reads as "the animation is missing". A cue nobody perceives is not a cue.

- [x] 8.1 (TDD: test → impl) Widen the travel so it reads at arm's length and lengthen the
      run so it survives the seconds a learner spends settling into the enlarged video:
      `arrow-drop` displaces by 60% and the run becomes `repeat-[6.5]`.
- [x] 8.2 Re-measure on the iOS simulator: the vertical span must be perceptible (≈10px,
      not 4) and the arrow must still come to rest, not twitch, at the end.
