## Context

`GuideAutoplay` holds one piece of state, `stepIndex`, and one effect: a `setInterval` with an
empty dependency array that bumps the index every `STEP_INTERVAL_MS` and wraps with `%
FRAMES.length`. `FRAMES` is the four `INSTALL_STEPS` plus `INSTALL_RESULT`. The rest of the
component is presentation: the header, the scaled `GuidePhoneScreen`, the `aria-live` line,
the dot row, and the dismiss button. It is rendered inside a Radix dialog
(`AddToHomeScreenModal`) that shows it on iPhone Safari.

Two constraints shape everything below:

- **A drag may be aimed at scrolling rather than at the guide.** A guide that reads any drag
  as a swipe fights whatever the finger was really doing. (The dialog it sits in today locks
  the page's scroll — see Risks — so the rule is there for the hook's sake and for wherever
  the guide is placed next, not for a scroll it can see today.)
- **`prefers-reduced-motion` is read after mount and gates the timer.** The gesture must not
  be gated by it — that learner is the one with no other way to move — so the two paths have
  to be genuinely independent, not two branches of the same flag.

## Goals / Non-Goals

**Goals:**

- A horizontal drag over the guide moves it exactly one frame, in the direction of travel,
  wrapping at both ends.
- The automatic loop survives untouched, and a manual move gives the chosen frame a full
  dwell before the loop resumes.
- The gesture works under reduced motion, where the loop does not.
- "What counts as a swipe" lives in one named place with its threshold visible, not in
  handlers inlined among the JSX.

**Non-Goals:**

- Any visible affordance, pause control, or keyboard equivalent (see the proposal's
  Non-goals).
- Frame-follows-finger dragging, rubber-banding, or a slide transition between frames.
- Migrating any other component onto the new hook.

## Decisions

### Pointer events, not touch events

`onPointerDown` / `onPointerUp` on the guide's `<section>`, comparing the two coordinates.

*Why over touch events:* one code path covers finger, trackpad drag and mouse, so the
gesture is drivable in Storybook and in a test without synthesising `TouchList` objects,
which jsdom does not construct. React's synthetic pointer events carry `clientX`/`clientY`
directly, so the hook needs nothing from the DOM.

*Why not `setPointerCapture`:* it would guarantee the `pointerup` even when the finger leaves
the panel, but jsdom does not implement it, so every test would need it stubbed to exercise
the real path. The cost of not having it is that a drag released outside the guide is
ignored — the guide fills the dialog, and an ignored gesture is a non-event the learner
repeats.

*Why not a library (`react-swipeable`, `use-gesture`):* the whole decision is a subtraction
and two comparisons. A dependency here buys inertia, multi-touch and momentum that this
change's Non-goals rule out.

### A hook: `useHorizontalSwipe`

```ts
const swipeHandlers = useHorizontalSwipe({
  onSwipeLeft: showNextFrame,
  onSwipeRight: showPreviousFrame,
});
```

It returns the handlers to spread, holds the pending start in a `ref` (a start coordinate is
not something the UI renders, so it must not be state), and clears it on `pointercancel`.
The direction names are the finger's, not the outcome's: *what the hand did* is what the hook
knows, and *what it means* is the guide's to decide — which is also the seam where a
right-to-left locale would later reverse the mapping without touching the hook. All three
locales the app serves are left-to-right, so nothing does that today.

*Alternative considered — handlers inlined in `GuideAutoplay`:* rejected. The threshold and
the axis test are a policy with a number in it; inlined, they read as arithmetic in the
middle of a component whose job is to draw a guide.

### `SWIPE_THRESHOLD_PX = 48`, dominant axis wins

A gesture registers when `|dx| >= 48` **and** `|dx| > |dy|`. The threshold keeps a tap — and
the small travel a thumb makes while tapping the dismiss button — from moving the guide. The
axis test is what leaves scrolling alone: a drag meant for a document is vertical-dominant
and the guide declines it. 48px is roughly a thumb's width, the same order
as the platform's own minimum touch target, and small enough that a deliberate flick always
clears it.

### The loop becomes a per-frame `setTimeout`

`setInterval` with `[]` deps advances on a clock that started at mount and knows nothing
about the learner. Replacing it with a `setTimeout` whose effect depends on the current
frame index gives each frame its own full interval, and a manual move — which changes that
index — restarts the wait for free. No pause flag, no "last interaction" timestamp, no
second timer to reconcile.

*Cost:* `guide-autoplay.test.tsx` currently asserts `clearInterval` was called on unmount.
That test pins the mechanism rather than the behavior, and this change invalidates it. It is
rewritten to assert the behavior the requirement actually states — a guide taken off screen
does not advance — by unmounting and letting the clock run past several intervals. Stronger
assertion, and it survives the next timer rewrite.

### Frame arithmetic in one named place

`(current + delta + FRAMES.length) % FRAMES.length`, behind `showNextFrame` /
`showPreviousFrame`. The `+ FRAMES.length` is what makes going back from the first frame
land on the result instead of `-1`; it is the only non-obvious character in the change and it
gets a comment saying so.

### No `touch-action` declaration

Nothing inside the dialog scrolls horizontally, so no browser consumes a horizontal drag
here, and `touch-action: pan-y` would take pinch-zoom away from a depiction some learners
will want to enlarge. Left alone.

## Testing strategy

| Behavior | Layer | File | Mirrors |
| --- | --- | --- | --- |
| Threshold, direction, dominant-axis rejection, cancel | **Vitest unit** via `renderHook` + direct handler calls | `src/hooks/use-horizontal-swipe/use-horizontal-swipe.test.ts` (new) | `use-enlarged-video.test.ts` — `renderHook`, `act`, GIVEN/WHEN/THEN describes, `faker` for coordinates that are merely "far enough" |
| Swipe advances / goes back, wraps at both ends, restarts the dwell, works under reduced motion, vertical drag does nothing | **Vitest component + RTL** | `src/components/add-to-home-screen-guide/guide-autoplay/guide-autoplay.test.tsx` (existing) | its own `advanceSteps` fake-timer helper, `stubReducedMotion`, and the Spanish `MESSAGES` fixture — assertions read the step sentence, as the existing tests do |
| The guide still offers exactly one control after the gesture exists | **Vitest component + RTL** | same file — the existing "dismissing is the only control it offers" test, unchanged and expected to stay green | — |
| Anything in a real browser | **none** | — | The gesture lives entirely inside an already-e2e-free component; a Playwright drag would test jsdom-independent pointer plumbing at a hundred times the cost. Covered instead by driving the Storybook story by hand (see tasks) |

RTL drives the gesture with `fireEvent.pointerDown` / `pointerUp` carrying explicit
`clientX`/`clientY`: `userEvent.pointer` computes coordinates from layout, and jsdom lays
nothing out, so every element sits at the origin and every drag measures zero.

## Risks / Trade-offs

- **A mouse drag that selects text also moves the guide** → Accepted. The gesture is built
  for the touch device the guide is shown on; the panel's text is three short lines, and the
  worst case is a frame change the reader can reverse with the opposite drag.
- **A drag released outside the panel is ignored** (no pointer capture) → Accepted; the panel
  is the dialog's full width, and the learner simply repeats the gesture.
- **48px could feel heavy on a small phone or light on a desktop** → It is a single exported
  constant the tests read, so retuning it is one edit and no test rewrite.
- **The dots now under-report what the guide can do** — they show position, and the guide has
  become navigable without saying so → Accepted for this change, and named as the follow-up
  in the proposal's Non-goals.
- **The page behind the dialog is scroll-locked anyway** — Radix's `DialogContent` wraps its
  children in `react-remove-scroll`, so in the guide's only placement today there is no page
  scroll for a vertical drag to be mistaken for → The dominant-axis rule is kept regardless:
  it is what lets the hook be used outside a scroll-locked dialog, and it costs one
  comparison. Verified in the browser: a drag 120px sideways and 200px down leaves the frame
  alone.
- **iOS Safari's edge-swipe back gesture** can claim a drag that starts at the screen's left
  edge → Nothing to do at this layer; the guide is centred in a dialog with margin on both
  sides, so a gesture that starts on the guide does not start at the edge.
