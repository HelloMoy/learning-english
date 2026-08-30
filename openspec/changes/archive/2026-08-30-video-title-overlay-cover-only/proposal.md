## Why

The Lesson Page paints a gold title overlay (lesson eyebrow + module headline) on top of the video player, and it never goes away — it is rendered unconditionally, so at 0:44 of a 2:11 lesson it is still covering the speaker's face and mouth. On a pronunciation course the mouth is the content, so the decoration blocks exactly what the learner came to watch.

The overlay does earn its place in one situation: lessons served by the local-filesystem repository carry no `poster`, so before playback the frame is just black. There the overlay is the cover art. The fix is to scope it to that job instead of deleting it or leaving it up forever.

## What Changes

- The video hero's title overlay becomes a **cover treatment**, shown only while the player is idle *and* the lesson has no `poster`.
- When the lesson has a `poster`, the overlay never renders — the thumbnail is the cover.
- Once playback has started, the overlay disappears and stays gone for the rest of the session, whether the video is playing or paused. It does not flash back on `pause`, `seek`, or `ended`.
- `LessonView` learns whether playback has begun; `PlaybackPositionedVideoPlayer` already listens for the `play` event and gains a callback to report the first one upward.
- No information is lost when the overlay is hidden: the lesson title is in the breadcrumb above the player and in the `<h1>` below it, and the module title is in the breadcrumb and the outline sidebar.

## Capabilities

### New Capabilities

<!-- None. This change narrows an existing requirement. -->

### Modified Capabilities

- `cinema-lesson-view`: the "Lesson view renders as a cinema player with tabbed notes" requirement currently mandates a gold title overlay over the player, unconditionally. It changes to mandate that the overlay is a cover — present only when the lesson has no poster and playback has not started, and absent from the first `play` onward.

## Non-goals

- Deleting the overlay outright, or restyling it. Its markup, gradient scrim, and typography are unchanged; only the condition under which it renders changes.
- Bringing the overlay back on `pause`, `ended`, or when the learner seeks to `0:00`. The first `play` retires it for the session.
- Persisting "has played" across reloads. A fresh page load with no playback shows the cover again; that is the intended cold-load presentation.
- Any change to `NativeVideoPlayer`'s markup, to the resume overlay (`LessonVideoResume`), or to playback-position persistence.
- Backfilling `poster` values for the local-filesystem lessons. That would make the overlay moot, but it is a content problem for another change.
- Any change to `Eyebrow` or to the hero overlays on the home, course, and module pages.

## Impact

- `src/components/lesson-view/lesson-view/lesson-view.tsx` — the overlay block becomes conditional on `!lesson.poster && !playbackStarted`; the component gains local state for `playbackStarted`.
- `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.tsx` — gains an optional `onPlaybackStart` callback, fired from the existing `play` listener.
- `src/components/lesson-view/lesson-view/lesson-view.test.tsx` — the test `"video lesson renders a cinema hero overlay (module title) while preserving the native player"` is split into the poster-less cover case, the poster case, and the after-play case.
- `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.test.tsx` — one case for the new callback firing on `play`.
- `openspec/specs/cinema-lesson-view/spec.md` — purpose text and the video-hero scenario, updated via the delta spec.
- No domain, adapter, i18n, or route changes. No new dependencies.
