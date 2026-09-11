## Why

The install guide plays itself and nothing else: five frames on a 3.5-second loop, with a
dismiss button as the only control. That is right for a learner who just watches, and wrong
for the two things a learner actually does. They look away — at the «···» control they were
told to find, or at Safari's own menu covering the page — and come back to a guide that has
moved on, with no way back but waiting through the whole loop. Or they read faster than the
loop plays and sit through the remainder of a frame they have already understood.

The dots at the bottom already promise what the guide does not deliver. A row of dots under
a picture on an iPhone means *swipe*, and this one does not respond, so the guide reads as
broken rather than as automatic.

The learner who has asked for reduced motion has it worst: the guide does not advance at all
for them, so today it is a permanent picture of step 1 and the other four frames are
unreachable. Gestures are the only navigation that reaches them, because the reason there is
no timer is a preference this change must not overrule.

## What Changes

- **A horizontal swipe over the guide moves it one frame.** Swiping right-to-left goes to the
  next frame, left-to-right to the previous one — the direction the dots sit in, and the
  direction iOS has trained the finger to expect.
- **Both ends wrap.** Forward from the result returns to the first tap, as the timer already
  does; backward from the first tap arrives at the result. A carousel that dead-ends on its
  first frame makes the learner swipe forward four times to see what they missed once.
- **The automatic advance is kept exactly as it is.** The guide still plays itself, still
  loops, and still holds still under `prefers-reduced-motion`. A swipe is a nudge, not a
  takeover: there is no pause control, no "manual mode" the learner can get stranded in, and
  nothing to resume.
- **A swipe restarts the dwell, rather than landing mid-count.** The frame the learner chose
  gets the full interval before the timer moves on. Without this, a swipe made half a second
  before the tick would show the chosen frame for half a second — punishing the learner for
  arriving late rather than for having asked.
- **Reduced motion stays motionless and becomes navigable.** The gesture works there even
  though the timer does not; the preference is about movement the learner did not ask for,
  and this movement is the one they did.
- **A drag that is mostly vertical is not a swipe.** The dialog is a tall panel on a
  scrollable page, and a gesture meant for the page must not be read as a frame change.
- **No new control and no new copy.** The guide keeps offering exactly one button, and the
  gesture adds no string to any locale.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `add-to-home-screen-guide`: the requirement *"The guide plays itself"* today describes a
  guide the learner can only watch — it advances on a timer, loops, holds still under reduced
  motion, and stops when it leaves the screen. It gains the learner's own hand: a horizontal
  gesture that moves one frame in either direction, wrapping at both ends, restarting the
  dwell, and working under reduced motion precisely where the timer does not. The rules that
  do not depend on who moves the guide — the loop, the position report, the reduced-motion
  suppression of the *timer*, the stopped timer on unmount — stand unchanged. The requirement
  *"The guide instructs and never claims to install"*, which says dismissal is the only
  control the guide offers, is read against **controls**, and the gesture adds none; it is
  restated so that a future reader does not take the gesture for a violation of it.

## Impact

- `src/hooks/use-horizontal-swipe/use-horizontal-swipe.ts` (new) — the gesture itself: pointer
  down and up, a distance threshold, and the dominant-axis rule. A hook rather than
  handlers inlined in the guide, because "what counts as a swipe" is a decision with a
  threshold and an axis test in it, and the guide should read as *what a swipe does*.
- `src/hooks/use-horizontal-swipe/use-horizontal-swipe.test.ts` (new)
- `src/components/add-to-home-screen-guide/guide-autoplay/guide-autoplay.tsx` — the section
  takes the gesture's handlers; the loop's `setInterval` becomes a per-frame `setTimeout`
  keyed on the current frame, which is what makes a manual move restart the dwell
- `src/components/add-to-home-screen-guide/guide-autoplay/guide-autoplay.test.tsx` — the
  unmount test asserts the interval is cleared, an implementation detail the timer change
  invalidates; it is rewritten to assert the behavior (a guide off screen stops advancing)
- `src/components/add-to-home-screen-guide/guide-autoplay/guide-autoplay.stories.tsx` — a
  story for driving the gesture by hand in Storybook
- No new dependency. No message-file change.

## Non-goals

- **Any visible affordance for the gesture** — arrows, a "swipe" hint, or turning the dots
  into buttons. Every frame is still reachable by doing nothing at all, which is what keeps
  the gesture an enhancement rather than a requirement; a discoverability cue is a separate
  question with its own copy in three locales.
- **Pausing the loop.** Neither on swipe, nor on touch-and-hold, nor by a control. The
  automatic behavior is the guide's whole premise.
- **Vertical gestures**, dragging the depiction with the finger, rubber-banding, or any
  frame-follows-finger animation. The frames swap as they do today, replaying their own
  entry animation.
- **Keyboard or pointer equivalents** — arrow keys, click targets on the dots, a next/previous
  pair. The autoplay reaches every frame without input, so the gesture owes no alternative.
- **Reworking `GuidePhoneScreen`, the steps, or any copy.**
- **Making the gesture reusable beyond this guide today.** The hook is written to be
  general, but nothing else is migrated onto it in this change.
