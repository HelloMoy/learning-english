## Why

On a phone the resume overlay is cut off. The player is a 16:9 box — about 202px tall
at a 390px viewport — and the overlay's card is taller than that, so centring it inside
the player pushes its head and foot past the edges, where the lesson wrapper's
`overflow: hidden` clips them. The learner sees a card with no title, a half-sentence of
description, and no way to scroll to the rest.

Reproduced under iPhone emulation: the dialog's heading and the first line of its
description are gone, leaving the card opening mid-sentence on "from the beginning."

This is not an iOS defect. It follows from the overlay being bounded by the player,
which the `playback-position` capability requires and which is the right call — the
overlay is about the video, so it stays over the video. What is missing is that the
overlay was only ever sized for the ~360px-tall player of a desktop column.

## What Changes

- The overlay gets a **compact form at phone-class viewports**: the prose that only
  restates the offer gives way, and the padding and rhythm tighten, so the card fits the
  player's box with the two actions and the timestamp intact.
- The dialog keeps its accessible name and description at every size — the heading and
  the description text remain in the accessibility tree when they stop being painted, so
  a screen-reader user loses nothing.
- The card gains a **last-resort bound**: it never exceeds the player's height, and if
  its content somehow still would, it scrolls within itself rather than being clipped by
  an ancestor.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playback-position`: the requirement that defines the resume surface says it is
  "positioned over the video frame and bounded by it" but says nothing about staying
  legible inside that bound. It is amended so that being bounded by the player means the
  offer is fully readable and operable there, at every viewport the app supports.

## Impact

- `src/components/lesson-view/lesson-video-resume-overlay/lesson-video-resume-overlay.tsx`
  and its colocated test and stories.
- `e2e/lesson-playback-resume.spec.ts` — a phone-viewport assertion.
- No message changes: the same keys are used, only their presentation adapts.
- No domain, adapter, hook, or persistence changes. The thresholds, the hold-on-`playing`
  rule, and every action the overlay offers are untouched.

## Non-goals

- **Changing when the overlay appears.** The 30s / last-10s thresholds and the
  first-play rule stay exactly as specified.
- **Making the overlay a modal**, or moving it outside the player's subtree. The
  capability forbids both, deliberately.
- **Redesigning the card** for desktop, where it fits today and should look unchanged.
- **The player's own iPhone defects** — the black slab and the missing fullscreen
  control are the separate `fix-iphone-video-player` change.
