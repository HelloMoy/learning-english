## Why

Every install guide answers a horizontal drag, and nothing tells the learner so. On an iPhone
that was a deliberate trade: the gesture is a silent extra on top of a guide that plays itself,
and the spec says so — it "adds no element to the guide, nothing announces it, and every frame
it reaches is reached anyway by a learner who does nothing."

Two guides have since been added, and on one of them the trade no longer holds. **A horizontal
drag on a card is not a gesture anyone performs with a mouse.** A learner on a Mac who looks
away and misses a step cannot get it back at all; their only option is to wait out the whole
loop — 3.5 seconds times three or four frames — and catch it on the next pass. The capability
exists in the code and does not exist for them.

The second complaint is one no guide answers on any platform: a learner reading an instruction
has no idea how long it will stay. Frames simply change.

## What Changes

- Every guide gains a **control rail** in place of its position dots: a previous control, the
  dots, and a next control. It works with a finger, a mouse and a keyboard, and it needs no
  gesture to be discovered first.
- The **dots become controls**, sized to be pressed, each one jumping straight to its frame.
- The active dot **fills over the interval**, so the learner can see how long the frame they
  are reading has left before the guide moves on.
- This applies to **all three guides** — iPhone, iPad and Mac. Confining it to Safari would
  leave one guide behaving differently from the others for no reason a learner could name.
- The horizontal drag **stays**, unchanged and still unannounced. It is now a shortcut for
  something visible rather than the only way in.
- **BREAKING for two requirements**: dismissal is no longer the only control a guide offers,
  and the gesture is no longer the guide's only way to move by hand.

## Capabilities

### Modified Capabilities

- `add-to-home-screen-guide`: *The guide plays itself* changes — the guide now offers visible
  controls alongside the gesture, and reports its remaining time. *The guide instructs and
  never claims to install* changes — its controls are no longer just the dismiss control, and
  the rule it actually protects (that nothing offers to perform the install) is restated so it
  survives the addition.
- `safari-install-guides`: *Both guides play themselves the way the iPhone guide does* changes
  to carry the same controls, since the three are specified to behave alike.

## Non-goals

- **No pause control.** The guide plays itself; a pause is a mode to get stranded in, and the
  dots already let a learner hold a frame by choosing it.
- **No change to the pacing.** The interval stays where it is.
- **No change to what the guides teach.** Steps, copy, depictions and detection are untouched.
- **No gesture hint.** A shown-once animation was designed alongside this and rejected: it does
  not work with a mouse, and remembering that it has been shown is state the guides deliberately
  do not keep.
- **No new control on the install prompt.** It has no frames to move between.

## Impact

- **New**: `src/components/guide-playback-rail/` — the shared rail, used by all three guides —
  and a `Components.GuidePlaybackRail` namespace in every locale.
- **Modified**: `src/hooks/use-guide-playback/use-guide-playback.ts` exposes the moves it
  already performs (`showNext`, `showPrevious`, `showFrame`) plus whether it is currently
  playing; `guide-autoplay.tsx` and `safari-guide-autoplay.tsx` render the rail in place of
  their own dot lists.
- **Accessibility**: the rail is the first keyboard-reachable way to move a guide. Its controls
  carry localized names, and the dots say which frame they lead to.
- **Reduced motion**: the fill is movement, and it describes a timer that does not run under
  `prefers-reduced-motion`. It is therefore absent there rather than frozen, which would show a
  countdown that never counts.
- **No domain impact.**
