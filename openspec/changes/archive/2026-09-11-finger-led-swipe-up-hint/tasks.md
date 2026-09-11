## 1. Copy

- [x] 1.1 Add a failing guard to `src/messages/messages.test.ts`: neither key of
      `Components.ScrollDownHint` may carry a verb of scrolling in any locale, since one
      beside an upward arrow is the cue disagreement this change exists to remove. It is
      the only place the copy can be checked "under any locale" — `scroll-down-hint.test.tsx`
      mocks `next-intl` and never reads the catalogues (TDD: test first, red on all three)
- [x] 1.2 Rewrite `Components.ScrollDownHint.message` in `src/messages/{en,es,pt}.json` to
      `Drag the video up` / `Arroja el video hacia arriba` / `Arremesse o vídeo para cima`
      (TDD: impl for 1.1)
- [x] 1.3 Rewrite `Components.ScrollDownHint.screenReaderMessage` in all three catalogues so
      the spoken sentence names the gesture, its direction and the full screen it earns
      (TDD: impl for 1.1 — the guard covers both keys)
- [x] 1.4 Flip the `MESSAGES` fixture in `scroll-down-hint.test.tsx` to the new Spanish
      copy, so a hint that starts rendering stale defaults still fails there rather than in
      a learner's lesson, and confirm the locale-parity guard stays green untouched — no key
      was added or removed

## 2. The arrow and its motion

- [x] 2.1 Turn the glyph assertion in `scroll-down-hint.test.tsx` to expect
      `lucide-arrow-up` while still rejecting `rotate-180`, then swap the import in
      `scroll-down-hint.tsx` from `ArrowDown` to `ArrowUp` (TDD: test → impl)
- [x] 2.2 Turn the travel assertion to expect `animate-arrow-lift`, then add
      `--animate-arrow-lift` and its `arrow-lift` keyframes to `src/app/globals.css` —
      `translateY(-60%)` held at `0%`/`100%`, `transform: none` at `50%` — and point the
      component's class at it (TDD: test → impl)
- [x] 2.3 Delete `--animate-arrow-drop` and its keyframes from `globals.css` after
      confirming by `grep` that nothing else references them; the rename is what makes a
      stale stylesheet degrade to a still arrow instead of downward motion
      (TDD: covered by 2.2's assertion)
- [x] 2.4 Confirm `repeat-[6.5]` and `motion-reduce:animate-none` assertions still pass
      unchanged — the new keyframe keeps the displaced-at-both-ends shape the half
      iteration depends on (TDD: existing tests, no new impl)

## 3. The entrance

- [x] 3.1 Turn the entrance assertion to expect `slide-in-from-bottom-2`, then change the
      status region's class in `scroll-down-hint.tsx` so the pill lifts into place the way
      the arrow points (TDD: test → impl)

## 4. Prose that argues the old rule

- [x] 4.1 Rewrite the `ScrollDownHint` JSDoc so it argues the finger's direction: one
      cue's worth of direction, the verb committed to the throw, the glyph carrying
      direction and never a CSS class. Update the inline comment beside the arrow.
- [x] 4.2 Rewrite the comment above the keyframes in `src/app/globals.css` — it currently
      explains why `bounce` was mirrored downward
- [x] 4.3 Update the `scroll-down-hint.stories.tsx` docblocks: the meta block's "bounded
      downward travel" and the `Default` story's paragraph about the page's direction.
      Correct its stale "about four and a half seconds" to the 6.5 seconds the component
      actually runs
- [x] 4.4 Update the one JSDoc line in `lesson-video-player.tsx` that describes what the
      hint says

## 5. Verification

- [x] 5.1 Run `pnpm test:run` — the component tests, the locale-parity guard and everything
      else must be green
- [x] 5.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure at
      its root
- [x] 5.3 Drive Storybook in the browser: `LessonView/ScrollDownHint` in `en`, `es` and `pt`
      — the pill lifts in, the arrow travels up and rests pointing up, and each locale's
      line holds one line at a phone's landscape width
- [x] 5.4 Run the enlarged-player e2e (`pnpm test:e2e e2e/lesson-video-player.spec.ts`,
      `--workers=1`, with `PLAYWRIGHT_BASE_URL` set) to confirm the hint's appear,
      auto-leave and dismiss coverage follows the new copy without an edit
