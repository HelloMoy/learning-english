## 1. The gesture, on its own

- [x] 1.1 Write `src/hooks/use-horizontal-swipe/use-horizontal-swipe.test.ts`: a drag of at
      least `SWIPE_THRESHOLD_PX` towards the left calls `onSwipeLeft`, towards the right
      calls `onSwipeRight`. Drive it with `renderHook` and call the returned handlers with
      plain `{ clientX, clientY }` objects, mirroring `use-enlarged-video.test.ts` for the
      GIVEN/WHEN/THEN shape and `faker` for the slack past the threshold
      (TDD: test first, red — the hook does not exist)
- [x] 1.2 Create `src/hooks/use-horizontal-swipe/use-horizontal-swipe.ts` with the minimum
      that passes 1.1: `"use client"`, the start coordinate in a `ref`, the returned
      `onPointerDown` / `onPointerUp`, and `SWIPE_THRESHOLD_PX` exported so the tests read
      the same number the hook does (TDD: impl for 1.1)
- [x] 1.3 Add the failing cases and make them pass: a drag shorter than the threshold calls
      neither callback; a drag that travels further vertically than horizontally calls
      neither, whatever its horizontal distance; a `pointerup` with no preceding
      `pointerdown` calls neither (TDD: test → impl, one case at a time)
- [x] 1.4 Add `onPointerCancel`: a cancelled gesture discards the start, so the next stray
      `pointerup` cannot be read against a coordinate from a gesture the browser already
      abandoned (TDD: test → impl)
- [x] 1.5 JSDoc the hook per `jsdoc-typescript-docs`: summary, `@remarks` carrying the
      finger-not-outcome naming and why the start is a ref, `@example`, `@param`,
      `@returns`, `@category`. Walk the `clean-code` implementation checklist over the file

## 2. The guide moves by hand

- [x] 2.1 In `guide-autoplay.test.tsx`, add a failing test: a right-to-left drag over the
      guide's section shows the next step. Use `fireEvent.pointerDown`/`pointerUp` with
      explicit `clientX`/`clientY` — `userEvent.pointer` reads coordinates from a layout
      jsdom does not compute (TDD: test first, red)
- [x] 2.2 Wire `useHorizontalSwipe` into `GuideAutoplay` and spread its handlers on the
      `<section>`; add `showNextFrame` / `showPreviousFrame` over one wrapping index helper,
      with the comment explaining what `+ FRAMES.length` buys (TDD: impl for 2.1)
- [x] 2.3 Add failing tests for the remaining directions and both wraps — left-to-right goes
      back; back from the first step reaches the result; forward from the result reaches the
      first step — then make them pass (TDD: test → impl)
- [x] 2.4 Add a failing test that a vertical-dominant drag across the guide leaves the frame
      alone, so the dialog's page can still be scrolled (TDD: test — expected to pass off
      1.3's axis rule; keep it, it pins the guide's behavior and not only the hook's)

## 3. The loop keeps playing, and yields to the hand

- [x] 3.1 Add a failing test: after a manual move, the guide holds the chosen frame for a
      full `STEP_INTERVAL_MS` and only then advances — drive the clock most of the way
      through an interval before the drag, so a timer that survived the move fails this
      (TDD: test first, red against today's `setInterval`)
- [x] 3.2 Replace the `setInterval` effect with a per-frame `setTimeout` whose dependency is
      the current frame index (TDD: impl for 3.1)
- [x] 3.3 Rewrite the unmount test: it asserts `clearInterval` was called, which pins the
      mechanism and not the requirement. Assert instead that a guide taken off screen shows
      nothing further — unmount, run the clock past several intervals, and confirm no
      pending timer remains (TDD: test rewrite → no impl; 3.2 must already satisfy it)
- [x] 3.4 Add a failing test that under `prefers-reduced-motion` a drag still moves the guide
      one frame while the timer stays silent, then confirm the implementation keeps the two
      paths independent (TDD: test → impl if the gesture turns out to be gated)
- [x] 3.5 Confirm the existing "dismissing is the only control it offers" test is still green
      untouched — the gesture must add no element to the guide (TDD: existing test, no impl)

## 4. Prose and the story

- [x] 4.1 Update the `GuideAutoplay` JSDoc: the remarks currently argue that the learner does
      nothing and that a learner who looks away comes back to a guide that has moved on.
      That paragraph is exactly what this change answers — rewrite it to say the loop plays
      itself *and* yields to the hand, and why the gesture survives reduced motion
- [x] 4.2 Add a story to `guide-autoplay.stories.tsx` for driving the gesture by hand, with a
      docblock naming the drag and the threshold; keep the existing stories' meta and locale
      handling, and add no `vi.mock("next-intl")`
- [x] 4.3 Walk the `clean-code` implementation checklist over `guide-autoplay.tsx`: function
      size, one level of abstraction, intention-revealing names for the two frame movers,
      and no comment that says *what* rather than *why*

## 5. Verification

- [x] 5.1 Run `pnpm test:run` — the new hook tests, the guide's tests and everything else
      must be green
- [x] 5.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure at
      its root
- [x] 5.3 Drive Storybook in the browser with Playwright MCP: open the guide's story, drag
      left and right across the panel, confirm it moves one frame each way, wraps at both
      ends, and that the loop resumes a full interval later
- [x] 5.4 Check the vertical-drag rule against the guide's real placement. **Finding: the
      premise of this task was wrong.** Radix's `DialogContent` wraps its children in
      `react-remove-scroll`, so the page behind the modal does not scroll while the guide is
      open and there is no page gesture to protect there. The rule stands anyway — it keeps a
      vertical drag from moving the guide, which was confirmed in the browser under 5.3, and
      it is what lets the hook be placed outside a scroll-locked dialog later. `design.md`
      and the delta spec's rationale were corrected rather than left claiming otherwise. No
      Playwright spec is added — the change touches no e2e-covered flow
