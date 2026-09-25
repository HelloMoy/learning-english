## Context

Three guides now share `useGuidePlayback`, which owns the timer, the wrap, the reduced-motion
rule and the swipe wiring. Each guide draws its own position dots as a decorative `<ol>` and
offers exactly one control: dismiss.

The gesture is the only way to move a guide by hand, and nothing announces it. That was a
deliberate trade on a phone. It stopped holding when the Mac guide shipped: a horizontal drag on
a card is not something anyone does with a mouse, so on macOS the capability reaches nobody.

## Goals / Non-Goals

**Goals:**

- Visible, keyboard-reachable controls for moving any guide, on every platform.
- A learner can see how long the frame they are reading has left.
- One implementation, so the three guides cannot drift.
- The gesture keeps working, unchanged.

**Non-Goals:**

- A pause control, a different interval, or any change to what the guides teach.
- A gesture hint animation.

## Decisions

### The hook exposes the moves it already makes

`useGuidePlayback` gains `showNext`, `showPrevious`, `showFrame(index)` and `isPlaying`. It
already performs the first two for the swipe; exporting them is what lets a button do the same
thing rather than a second copy of the wrap arithmetic.

`isPlaying` is `false` under `prefers-reduced-motion`, and it is what the countdown reads.

**Why `useSyncExternalStore` for the preference:** it is currently read once inside the effect,
which is enough to decide whether to arm a timer but not enough to render a countdown that has
to disappear when the preference is on. Subscribing to the media query gives a value that is
correct on the first client render, matches the server, and follows the viewer if they change
the setting mid-session. A `useState` + `useEffect` pair would paint a countdown and then remove
it, which is exactly the flash the preference exists to prevent.

### One rail component, three callers

`GuidePlaybackRail` takes the frame count, the current index, the number of frames that are
taps, and the three callbacks. It renders previous, the dots, and next.

**Why not let each guide draw its own:** the three are specified to behave identically, and the
rail is where most of that behaviour now lives. Two copies is two places for the keyboard order,
the accessible names and the countdown to come apart.

**Why the tap count is a prop:** the dots include the result frame, which is not a step. The rail
names the first *n* dots "step *i*" and the last one the result, so it never offers to take a
learner to "step 5" of a four-tap flow.

### The countdown is a CSS animation, keyed to the frame

The active dot carries an animation of exactly the step interval, restarted by keying the
element on `frameIndex`. No timer in React, no per-frame state, and no second clock to drift
from the one that actually advances the guide.

It is rendered only while `isPlaying`. Under reduced motion the project's global rule would
freeze it at zero width, which reads as a countdown that has stalled; absent is honest.

**Alternative considered — a ring around the next control:** clearer as a countdown, but it puts
time pressure beside the control that skips ahead, which reads as a prompt to hurry. On the dot
it reads as position, which is what it is.

### The dots become buttons, and grow

From 6px to a pressable size. They keep the active dot's elongated shape, so the row still reads
as position first and controls second.

**Why not leave them decorative and ship only the arrows:** a learner who has watched two frames
go by wants the one they missed, not one step back from wherever the loop has reached. The dots
are the only control that answers that in one action.

### Copy lives in its own namespace

`Components.GuidePlaybackRail` — `previous`, `next`, `goToStep` (`{number}`), `goToResult`.
Shared by all three guides rather than duplicated into two guide namespaces that would then have
to be kept in step.

## Risks / Trade-offs

- **Three controls where there was one.** The guide gets busier, and the spec that said
  dismissal was its only control has to change. → The rail replaces the dots rather than being
  added beside them, so the guide gains a row of controls where it already had a row of marks.
- **The countdown competes with the instruction for attention.** → It is on the dot, at the
  bottom, in the colour already used for position; nothing about it moves except the fill.
- **Keyboard order.** The rail sits between the instruction and the dismiss control, so tabbing
  reaches "move" before "close". → That is the order of likelihood, and the dismiss control keeps
  its position in the corner.
- **A fourth caller could forget the rail.** → It is rendered from the two autoplay components,
  which are the only things that walk frames; a new guide would use one of them.

## Testing strategy

Red before green on every task.

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `useGuidePlayback` exposes `showNext` / `showPrevious` / `showFrame` with both ends wrapping, and `isPlaying` following the preference | **Vitest unit** (`renderHook`) | its own existing suite |
| Moving by a control gives the chosen frame a full interval, as a gesture already does | **Vitest unit** | the gesture assertion already there |
| The rail renders previous, next and one control per frame, each localized; the result's control is not called a step | **Vitest component + RTL** | `guide-autoplay.test.tsx` |
| Activating a control moves the guide | **Vitest component + RTL** | same |
| The countdown is present while playing and absent under reduced motion | **Vitest component + RTL** | the reduced-motion assertions already in both autoplay suites |
| Both autoplays render the rail and still report position | **Vitest component + RTL** | both existing suites, extended |
| Every locale writes the rail's namespace | **Vitest unit** | `messages.test.ts` |

**Not Playwright.** Every behaviour is component-level.

**Storybook.** `guide-playback-rail.stories.tsx` with a first, middle, result and reduced-motion
story; the existing guide stories exercise it in place.

**Visual check.** All three guides reviewed in the browser with Playwright MCP, plus the iPad
simulator, before the change is called done.

## Open Questions

None blocking.
