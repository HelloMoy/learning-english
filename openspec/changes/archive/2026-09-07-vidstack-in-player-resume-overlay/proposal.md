## Why

The "Resume playback" prompt is a full-viewport modal that fires on mount, before the
learner has expressed any intent to watch. It blacks out the whole page, traps focus,
and demands an answer from someone who may have opened the lesson only to read the
notes or grab a resource. The decision it asks for — "resume or restart?" — is a
decision *about the video*, so it belongs to the video: inside the player frame, at the
moment the learner actually presses play.

Doing that on the native `<video>` element is not possible without hand-rolling player
chrome: the native controls are an opaque shadow-DOM widget, so an overlay drawn over
them either covers the scrubber or is covered by it, and `play` cannot be intercepted
and resumed under our own terms. Vidstack Player gives us a real component tree — the
provider, the layout, and our own overlay as siblings inside one `<MediaPlayer>` — plus
a typed play/pause API to gate the first play on the learner's answer.

## What Changes

- **BREAKING** The Player stops being the browser's native `<video controls>` widget
  and becomes a Vidstack `<MediaPlayer>` with `<MediaProvider>` and Vidstack's
  **Default Video Layout** chrome. `NativeVideoPlayer` is replaced by a
  `LessonVideoPlayer` built on Vidstack.
- **BREAKING** The resume prompt stops being a modal dialog. `LessonVideoResumeModal`
  (a `NiceModal.create` + shadcn `Dialog`) is replaced by
  `LessonVideoResumeOverlay`, a plain component rendered **inside** the
  `<MediaPlayer>` subtree, scoped to the player box. No page backdrop, no
  `aria-hidden` on the rest of the page, no portal.
- **BREAKING** The prompt's trigger moves from *player mount* to *first play*. Landing
  on a lesson with a saved position now shows nothing; the overlay appears only when
  the learner presses play. That first play is intercepted: the player pauses, the
  overlay asks, and playback then continues from the learner's chosen point.
- Choosing **Resume** seeks to the saved position and plays. Choosing **Restart**
  seeks to `0` and plays. Dismissing (`Escape` or the close control) also plays from
  `0` — the learner asked to watch, so the video always ends up playing.
- The overlay is offered **at most once per player mount**, on the same
  `isPositionResumable` thresholds as today. Once answered or dismissed, later plays
  and pauses go straight through.
- Playback-position persistence keeps its current contract (debounced `timeupdate`
  writes, immediate writes on pause/seeking/ended, flush on unmount and
  `beforeunload`, no write before the first interaction) but reads its events from
  Vidstack's player instance instead of raw `<video>` DOM listeners.
- Vidstack's Default Layout labels are localized through `next-intl` for every locale
  in `src/i18n/routing.ts` (`en`, `es`, `pt`), like every other string in the app.
- The gold title cover keeps its current rule (poster-less lessons only, retired on
  the first `play`) and keeps clearing the way for the player's controls.

## Non-goals

- No change to the domain: `PlaybackPositionRepository`, `recordPlaybackPosition`,
  `getPlaybackPosition`, and the `browser-local-storage` adapter are untouched.
- No change to the resume thresholds themselves (`< 30s` from the start, `< 10s` from
  the end) — `isPositionResumable` keeps its current rules and tests.
- No captions, chapters, thumbnail previews, quality menus, HLS/DASH, or Google Cast.
  Vidstack makes these cheap later; none of them ship here.
- No auto-marking a lesson complete from watched percentage.
- No removal of the `Dialog` primitive or of `@ebay/nice-modal-react`. Both stay for
  actual modals; only this one surface stops being a modal.
- No cross-device sync — the position stays per-device in `localStorage`.

## Capabilities

### New Capabilities

_None._ The change re-specifies behavior that `lesson-page` and `playback-position`
already own; introducing a third capability would split one player's rules across
three specs.

### Modified Capabilities

- `lesson-page`: "The Player is the native HTML5 `<video controls>` element" is
  replaced by a Vidstack `<MediaPlayer>` requirement — Default Layout chrome, the
  lesson `source` and `poster` still driving it, and a stated allowance for in-player
  overlays (which the old requirement forbade outright).
- `playback-position`: the resume prompt requirement changes from a focus-trapping
  modal opened on mount to an in-player overlay opened on the first play, and the
  dismissal requirement changes from "restart, still paused" to "restart and play".
  The persistence requirement is reworded to reference the player instance rather
  than the raw `<video>` element, with the same cadence and gating.
- `cinema-lesson-view`: the video hero requirement says "the native player"; it is
  restated in terms of the Vidstack player so the cinema layout spec and the
  lesson-page spec do not contradict each other. The title-cover rules are unchanged
  in substance.

## Impact

**Dependencies**

- Adds `@vidstack/react` (and its `vidstack` core) as a production dependency.
- Adds two CSS imports (Vidstack default theme + video layout) at the player module.

**Code**

- `src/components/lesson-view/native-video-player/` — replaced by
  `src/components/lesson-view/lesson-video-player/` (component, test, story).
- `src/components/modals/lesson-video-resume-modal/` — replaced by
  `src/components/lesson-view/lesson-video-resume-overlay/` (component, test, story).
  `src/components/modals/` is left with no entries; the directory convention stands
  for the next modal.
- `src/components/lesson-view/playback-positioned-video-player/` — rewired to the
  Vidstack player ref, the play interception, and the overlay's rendered state.
- `src/components/lesson-view/lesson-view/lesson-view.tsx` — the title cover keeps
  its `onPlaybackStart` latch; the player element it wraps changes.
- `src/messages/{en,es,pt}.json` — the `LessonVideoResumeModal` namespace is renamed
  to `LessonVideoResumeOverlay`, and a `VideoPlayer` namespace is added for the
  Vidstack layout labels.
- `e2e/lesson-playback-resume.spec.ts` — the flows now press play before asserting on
  the overlay, and query the overlay inside the player rather than a dialog.

**Not affected**

- `src/domain/**`, `src/adapters/**`, the Server Actions, and every other page.
