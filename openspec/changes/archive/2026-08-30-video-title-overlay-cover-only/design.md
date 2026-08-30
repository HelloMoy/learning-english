## Context

`LessonView` (`src/components/lesson-view/lesson-view/lesson-view.tsx:88-110`) wraps `PlaybackPositionedVideoPlayer` in a `div.relative` and paints an absolutely positioned block on top of it: a gradient scrim, an `Eyebrow` carrying `lesson.title`, and an `<h2>` carrying `module.title` in gold with a glow text-shadow. The block is `pointer-events-none`, so the native controls still work, and it has **no render condition** — it stays on screen for the entire lesson.

Two facts shape the fix:

1. The courses are pronunciation lessons filmed as head-and-shoulders shots, so a permanent headline lands over the speaker's mouth — the one thing the learner needs to see.
2. `Lesson.poster` is optional (`src/domain/entities/lesson/lesson.ts:35`), and the **local-filesystem repository never sets it** — only the in-memory seed does. So for real content the idle player is a black rectangle, and the overlay is the only cover art the page has.

So the overlay is not wrong, it is unscoped: it is cover art doing duty as a permanent watermark. The change gives it the two conditions it always implied — no poster, and not yet played.

`LessonView` is already a `"use client"` component, so it can hold the small piece of state this needs without a directive change.

## Goals / Non-Goals

**Goals:**

- The overlay renders only as a cover: `no poster` AND `playback not started`.
- From the first `play`, the frame is unobstructed for the rest of the session — paused, seeking, and ended included.
- The mechanism reuses the `play` listener `PlaybackPositionedVideoPlayer` already has, rather than adding a second source of truth for "has the video started".

**Non-Goals:**

- Restyling or deleting the overlay markup.
- Reappearing on `pause`/`ended`, or persisting "has played" across reloads.
- Touching `NativeVideoPlayer`, `LessonVideoResume`, or playback-position persistence.
- Backfilling posters for filesystem lessons (a content change that would make the cover moot).

## Decisions

**D1 — Two independent conditions, not one.**
`poster` is known at render time from the view data; `playbackStarted` is runtime state. Combining them as `!lesson.poster && !playbackStarted` keeps each condition readable and means a lesson that later gains a poster needs no code change. A single "should show cover" boolean computed elsewhere would hide the poster rule inside the player, which has no business knowing about cover art.

**D2 — `PlaybackPositionedVideoPlayer` reports the first `play` upward via an optional `onPlaybackStart` callback.**
The wrapper already subscribes to `play` to flip `hasInteractedRef`. The callback fires from that same listener, so there is exactly one place that decides "playback has begun". Alternatives rejected:

- *A second `play` listener in `LessonView`* — would need its own ref to the `<video>`, duplicating the subscription the wrapper already owns.
- *Passing the overlay into the player as `children`* — pushes a presentational concern (which titles, which gradient) into the persistence wrapper and makes the player's contract fuzzier.
- *Deriving it from `video.currentTime > 0`* — wrong: the resume seek sets `currentTime` on mount without any playback, so the cover would vanish on cold load for any lesson with a saved position.

The prop is optional so existing call sites and stories keep compiling unchanged.

The callback is held in a **ref**, not in the listener effect's dependency list. `LessonView` passes an inline arrow, so a dependency would re-subscribe the media listeners on every render — and that effect's cleanup calls `debouncedWrite.flush()`, which would force an immediate `localStorage` write per render and defeat the 1500ms debounce entirely. The ref keeps the subscription stable regardless of the caller's callback identity, so no correctness burden lands on the caller.

**D3 — One-way latch, never reset.**
`onPlaybackStart` fires on every `play` event, but the handler sets state to `true` and nothing sets it back. Repeated `play` events after a pause are therefore no-ops (React bails out on an identical state value), and the cover cannot flash back between pause and resume. This is what "ya sea en pausa o playing" requires: *playback mode* is entered once and not left.

**D4 — Keep the outer `relative`.**
The overlay is still positioned against the outer `div`, which also carries `overflow-hidden rounded-2xl border border-border bg-black`. Nothing about the container changes.

**D5 — `Eyebrow` stays imported.**
Unlike an outright deletion, the overlay markup survives, so `LessonView` keeps its `Eyebrow` import. `Eyebrow` also remains in use by `cinema-hero`, `course-overview`, and `module-overview`.

## Risks / Trade-offs

- **A poster-less lesson still shows a headline over the first frame** → Intended. That frame is black for filesystem lessons, and the cover disappears the moment the learner presses play.
- **A learner who pauses to read the title has no title on the frame** → The `<h1>` sits directly below the player and the breadcrumb directly above it; nothing is unreachable.
- **`play` can fire before React attaches the callback (autoplay)** → Not a live risk: `NativeVideoPlayer` sets neither `autoplay` nor `muted`, so the first `play` is always a user gesture, well after mount. If autoplay is ever added, the mount effect would need to seed the latch from `!video.paused`.
- **The in-memory seed sets a poster while filesystem content does not**, so Storybook and dev-seed runs will show a different hero from production content → Made explicit by covering both branches in the tests, so the difference is documented rather than surprising.

## Testing strategy

- **Vitest component + RTL — `src/components/lesson-view/lesson-view/lesson-view.test.tsx`** (owns the cover's render conditions). The existing overlay test is split into three, all following the file's current pattern (render `LessonView` with the local `fixtures()` view, assert on roles):
  1. *poster-less, idle* → `getByRole("heading", { name: "Module" })` is present, and `document.querySelector("video")` is non-null. Keeps the existing `[aria-current="page"]` assertion.
  2. *with poster* → `fixtures()` view whose lesson carries a `poster`; `queryByRole("heading", { name: "Module" })` is null.
  3. *after play* → poster-less lesson, then `fireEvent.play(document.querySelector("video"))` wrapped in `act`; `queryByRole("heading", { name: "Module" })` becomes null. This is the regression guard for the reported bug.
- **Vitest component + RTL — `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.test.tsx`** (owns the callback contract): one case asserting `onPlaybackStart` is called when the `<video>` emits `play`, mirroring how that file already drives media events for the persistence cases; and that omitting the prop does not throw on `play`.
- **Vitest unit** — nothing to add. No domain, use-case, or hook logic changes.
- **Playwright e2e** — nothing to add or change. `e2e/lesson-page.spec.ts` and `e2e/lesson-playback-resume.spec.ts` assert on the breadcrumb, the player, and the *resume* overlay, never the title cover; they must keep passing unchanged as proof that playback and position persistence are unaffected.
- **Verification** — full `vitest` run, the Playwright lesson specs, then a manual pass on a real (poster-less) lesson: cover visible on load, gone on play, still gone after pause.
