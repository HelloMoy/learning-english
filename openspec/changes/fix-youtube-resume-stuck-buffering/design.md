## Context

`PlaybackPositionedVideoPlayer` composes two hooks over a Vidstack `MediaPlayer`.
`useResumeOnFirstPlay` holds the learner's first play so the resume overlay can ask
where to start:

```
onPlay → handlePlay() → player.pause() → overlay → answer → seekTo(n) → play()
```

That works on the self-hosted lessons and fails on every YouTube lesson.

### What was measured

Reproduced with Playwright against the running app and then isolated in a standalone
Vidstack page (CDN build, `src="youtube/VZVwBdAGjBE"`, no app code) to rule out anything
project-specific. Each row is `pause()` issued at a different moment, then `seekTo(245)`
and `play()`:

| Sequence | Pause issued | Outcome |
| --- | --- | --- |
| `play()` → `pause()` from the `play` event | initial play in flight | **Dead.** No `pause` event is ever emitted. `waiting: true, started: false, currentTime: 0`, and the later `seeking` never completes. Unrecoverable. |
| `pause()` while idle, then `seekTo` + `play()` | provider never started | Works — reaches 249s, `playing: true` |
| `seekTo` + `play()`, no pause at all | never | Works — reaches 249s, `playing: true` |
| `play()` → `pause()` from the `playing` event | frames already rolling | Works — pause lands at `currentTime: 0.02`, then reaches 249s, `playing: true` |

The event log for the failing case is the whole story:

```
provider-setup, can-play, play, waiting, seeking     ← no `pause`, no `playing`, ever
```

Two conclusions follow. First, the seek target is irrelevant — Restart (`seekTo(0)`)
dies exactly like Resume, so this is not "YouTube cannot seek". Second, the poison is
narrow and well-defined: **the YouTube provider must not be paused while its initial
play request is in flight.** Before that window and after it, pause is honoured.

## Goals / Non-Goals

**Goals:**

- The resume overlay holds playback on a YouTube lesson and both answers start playback
  at the right position.
- One code path for both providers — the component tree never learns which provider it
  is driving.
- The regression is caught by a test that would have failed before the fix.

**Non-Goals:**

- Healing an already-stuck provider.
- Changing thresholds, overlay markup, focus behaviour, copy, or the persistence cadence.
- Replacing Vidstack's YouTube provider.

## Decisions

### D1 — Hold on `playing`, not on `play`

`play` fires when the *request* is made; `playing` fires when the provider is actually
rolling frames. Moving the hold to `playing` puts the `pause()` outside the poisoned
window for every provider, using only documented media events.

The cost is that a sliver of video plays before the overlay appears. The measurement
bounds it: the pause landed at `currentTime: 0.02` — 20 milliseconds of content. YouTube
spends its startup time in `waiting` (a spinner, no content), and `playing` is precisely
the edge where that ends. The learner sees the poster, then a spinner, then the overlay.

**Alternatives considered:**

- *Cancel the `media-play-request` event.* The cleanest UX — playback never starts at
  all — and it works in the probe with a capture-phase listener. Rejected: it depends on
  winning the listener-ordering race against the player's own internal handler, which is
  an implementation detail of the library. A fix for a buffering bug should not be able
  to break on a patch release.
- *Branch on the provider — pause immediately for `<video>`, defer for YouTube.* Rejected:
  `lesson-video-player.tsx` exists precisely so the rest of the tree stays true for both
  kinds of lesson. A vendor conditional here would spread the thing that file avoids, and
  it would buy 20ms.
- *Remount the player with `currentTime` set after the learner answers.* Rejected: it
  throws away and rebuilds the YouTube iframe, so the learner watches the player reload
  to answer a question — heavier and more visible than the bug.
- *Never hold at all; offer the choice before play is possible.* Rejected: it contradicts
  the standing requirement that landing on a lesson prompts nothing.

### D2 — The rename carries the decision

`handlePlay` becomes `handlePlaybackStarted`. The bug was a name that described the wire
(`onPlay`) instead of the moment (`playback has begun`), which is what made the wrong
wiring look right. The hook's structural `ResumablePlayer` port is unchanged — it is
still `pause` / `play` / `seekTo`, still driveable by three spies.

### D3 — `onPlay` keeps the write gate and `onPlaybackStart`

`persistence.openWriteGate()` and the `onPlaybackStart` callback that retires the gold
title cover stay on `onPlay`. They are about the learner's intent to watch, and firing
them a beat early is correct: the cover should retire when the spinner appears, not when
frames arrive.

## Risks / Trade-offs

- **20ms of video plays before the overlay appears.** → Bounded and measured; it is
  content time, not wall time, because provider startup happens in `waiting`. The
  subsequent seek makes it moot.
- **A provider that never reaches `playing` never gets the offer.** → That provider never
  plays either, so there is nothing to hold; the learner sees the player's own error
  state rather than a resume prompt over a dead frame.
- **`playing` also fires on every un-pause, not just the first.** → `isOfferSpentRef`
  already guards this; the existing "offered at most once per mount" scenario covers it
  and is kept.
- **The e2e YouTube test depends on youtube.com being reachable from CI.** → It mirrors
  `hosted-lesson-playback.spec.ts`, which already loads the real YouTube iframe, so the
  suite takes on no dependency it did not already have.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Vitest unit | `src/hooks/use-resume-on-first-play/use-resume-on-first-play.test.ts` | The rule itself, driven by three spies: the offer opens on `handlePlaybackStarted`, is spent once per mount, and both answers seek then play. Mirrors the existing spy-driven tests; only the trigger name changes. |
| Vitest component + RTL | `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.test.tsx` | The wiring: firing the player's `play` must **not** pause or open the overlay, and `playing` must. This is the test that fails before the fix. Mirrors the existing mocked-`LessonVideoPlayer` pattern in that file. |
| Playwright e2e | `e2e/lesson-playback-resume.spec.ts` | The resume cycle end-to-end on a **YouTube** lesson: after answering Resume, the player reports playing and the position advances past the saved point. Existing helpers read an `HTMLVideoElement`, which no YouTube lesson has, so the new test reads the player's own state through its `data-*` attributes — the same surface `hosted-lesson-playback.spec.ts` already asserts on. |

The component test is the regression gate: it fails on `main` today, because today the
overlay opens on `play`.
