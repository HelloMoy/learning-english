## Why

On a YouTube lesson, answering the resume overlay leaves the player buffering forever.
The learner presses play, the overlay offers "Resume from 04:11", and both answers —
Resume **and** Restart — end in a dead player: `data-buffering` stays on, `data-playing`
never appears, `currentTime` stays at `0`. Pressing play again does not recover it; only
a page reload does. Every video in the Basic Course is a YouTube lesson, so the resume
feature is entirely broken for that course while it works on the self-hosted courses.

The cause is the moment the hold happens, not the seek. `useResumeOnFirstPlay` calls
`player.pause()` from the `play` event — while the provider's initial play request is
still in flight. A `<video>` element tolerates that; the YouTube IFrame provider does
not: it swallows the pause (no `pause` event is ever emitted), lands in
`waiting: true, started: false`, and never leaves. The later `seekTo` and `play` are
issued into a provider that is already poisoned, which is why the Restart path — a seek
to `0` — fails identically.

## What Changes

- The resume offer holds playback when the provider reports playback has **actually
  begun** (`playing`), instead of when the play request is issued (`play`). Every
  provider can be paused at that point; none can be paused before it.
- `useResumeOnFirstPlay` renames `handlePlay` to `handlePlaybackStarted` so the trigger
  names the moment it now listens for.
- `PlaybackPositionedVideoPlayer` wires that trigger to the player's `onPlaying`. The
  write gate and the `onPlaybackStart` callback stay on `onPlay`, where they belong —
  they are about intent, not about frames rolling.
- The e2e resume cycle gains coverage against a YouTube lesson. The existing suite
  drives an `HTMLVideoElement`, so it only ever exercised the self-hosted provider —
  which is how this shipped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playback-position`: the requirement "The Lesson Page offers to resume from the saved
  position when within sensible bounds" changes *when* the player is held. It currently
  says the player is paused on the first play **request**; it will say the player is
  held once playback has **started**, and it gains the invariant that the offer must
  never pause a provider whose initial play request is still in flight.

## Non-goals

- No change to the resume thresholds (`MIN_SECONDS_FROM_START`, `SECONDS_NEAR_END`), to
  the overlay's markup, styling, focus behaviour, or copy.
- No change to the write cadence in `usePersistPlaybackPosition`.
- No vendor conditional in the component tree. The fix is provider-agnostic; the player
  never learns which provider it is driving.
- No switch away from Vidstack's YouTube provider, and no hand-written iframe.
- No attempt to recover a provider that is already stuck — the fix prevents the state
  rather than healing it.

## Impact

- `src/hooks/use-resume-on-first-play/use-resume-on-first-play.ts` — the trigger renames
  and its contract moves to "playback started".
- `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.tsx`
  — wires `onPlaying`.
- `src/hooks/use-resume-on-first-play/use-resume-on-first-play.test.ts` and
  `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.test.tsx`
  — follow the renamed trigger.
- `e2e/lesson-playback-resume.spec.ts` — gains a YouTube-lesson resume cycle.
- `openspec/specs/playback-position/spec.md` — via the delta spec.
