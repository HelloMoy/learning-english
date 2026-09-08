## Context

Today the Lesson Page renders three layers:

- `NativeVideoPlayer` — a bare `<video controls>` with a `ref` prop.
- `PlaybackPositionedVideoPlayer` — a smart wrapper that attaches DOM listeners to
  that element, persists the position through `usePlaybackPosition`, and on **mount**
  `await`s `NiceModal.show(LessonVideoResumeModal, ...)`.
- `LessonView` — draws the gold title cover over the player until the first `play`.

Two things are wrong with it. The prompt fires before the learner has asked for
anything, and it fires as a page-level modal: a full-viewport backdrop over a decision
that only concerns a 16:9 box in the middle of the page.

Fixing the *placement* is what forces the player swap. Native controls live in a
closed shadow root with a browser-chosen z-order; an overlay drawn over that box
either hides the scrubber or is painted under it, per browser. And there is no
supported way to say "this play request is on hold" — `play()` has already started by
the time `onPlay` reaches us, and pausing a native element from its own `play` handler
is exactly the kind of thing Safari and Firefox disagree about.

Vidstack replaces the closed widget with a component tree we own: `<MediaPlayer>` is
the positioning context, `<MediaProvider>` is the video, `<DefaultVideoLayout>` is the
chrome, and our overlay is a sibling of the layout inside the same box. The player
instance exposes `play()`, `pause()`, `currentTime`, and typed lifecycle callbacks, so
"pause, ask, then continue" is three ordinary calls instead of a fight with the DOM.

Constraints that shaped the design:

- `AGENTS.md`: every UI string through `next-intl` for `en`/`es`/`pt`; folder-per-entity
  with colocated test + story; Clean Code; TDD.
- The domain layer and the `playback-position` port/use-cases/adapter are out of scope
  and must not move.
- Vitest runs in jsdom, which has no media pipeline. Anything that depends on a real
  `play()` resolving cannot be a component test.

## Goals / Non-Goals

**Goals:**

- The resume decision is drawn inside the player frame, bounded by it, with no page
  backdrop and no `aria-hidden` on the rest of the document.
- It appears only on the learner's first play request, and never on mount.
- Whatever the learner answers — resume, restart, or dismiss — the video ends up
  playing, because a play request is what opened the overlay.
- The play-interception rule is unit-testable without a real media element.
- Position persistence keeps its current, already-specified contract.
- Vidstack's chrome is fully localized in `en`, `es`, and `pt`.

**Non-Goals:**

- Captions, chapters, thumbnail previews, quality/HLS, Cast. Vidstack supports them;
  none ship here.
- Any change under `src/domain/**` or `src/adapters/**`.
- Changing the resume thresholds (`isPositionResumable` keeps its rules and tests).
- Retiring `Dialog` or `@ebay/nice-modal-react` — both stay for real modals.

## Decisions

### D1 — Vidstack Default Layout, not hand-rolled chrome

`<DefaultVideoLayout icons={defaultLayoutIcons}>` with
`@vidstack/react/player/styles/default/theme.css` and
`.../styles/default/layouts/video.css`.

*Why:* the point of adopting a player library is to stop maintaining chrome. Composing
Vidstack's individual `PlayButton`/`TimeSlider`/`Menu` primitives would hand us back
the styling, keyboard, and ARIA work we are trying to shed, for a look the cinema
theme can reach with token overrides on the layout's CSS variables.

*Alternative considered:* `<MediaProvider>` with the browser's native `controls`. It
keeps the diff tiny but re-creates the exact z-order and interception problem that
motivated the change — it would buy us nothing.

### D2 — Intercept in `onPlay` by pausing, not by cancelling the request

`<MediaPlayer onPlay={...}>` fires after playback starts. The handler asks the resume
hook whether an offer is pending; if so it calls `player.pause()` and reveals the
overlay.

*Why:* it is one code path for every way playback can begin — the layout's play
button, a click on the video, the keyboard shortcut, a programmatic `play()`. Vidstack
also dispatches `media-play-request` *before* the action, which looks like the tidier
seam, but it only covers requests routed through Vidstack's own request pipeline;
anything that reaches the provider directly would slip past it and play straight
through the overlay. Pausing from `onPlay` cannot be bypassed.

*Trade-off:* a few frames may play before the pause lands. Acceptable: the video is at
`0` in that moment and the overlay covers the frame immediately.

### D3 — A headless hook owns the rule; the components own the pixels

New `src/hooks/use-resume-on-first-play/use-resume-on-first-play.ts`:

```ts
useResumeOnFirstPlay({ savedPositionSeconds, durationSeconds, player }): {
  offeredSeconds: number | null; // non-null → the overlay is showing
  handlePlay(): void;            // wire to <MediaPlayer onPlay>
  resumeFromSavedPosition(): void;
  restartFromBeginning(): void;  // also the dismissal path
}
```

`player` is a narrow structural type — `{ pause(): void; play(): void; seekTo(seconds: number): void }` —
that the wrapper builds from the `MediaPlayerInstance` ref. The hook never imports
Vidstack.

*Why:* this is the whole behavior of the change (one-shot guard, threshold gate, the
three outcomes) and it is the part jsdom cannot exercise through a real player. Behind
a structural type it is a plain Vitest `renderHook` test against a stub with three
spies. It also keeps `isPositionResumable` as the hook's only policy import, satisfying
the spec's "pure, separately testable predicate" clause.

*Alternative considered:* leaving the logic inline in
`PlaybackPositionedVideoPlayer`. That is where it lives today, and it is why the
current mount-time behavior is only reachable through mocked `NiceModal` calls.

### D4 — Dismissal is restart, and restart plays

`restartFromBeginning()` is the single exit for "Restart from beginning", `Escape`, and
the close control: `seekTo(0)` then `play()`. `resumeFromSavedPosition()` is
`seekTo(saved)` then `play()`.

*Why:* the overlay exists because the learner pressed play. Leaving the video paused
after they answer would swallow the request and force a second click. Collapsing
dismissal into restart also removes a third outcome nobody can describe a use for —
the stored position is untouched either way, so a dismissal costs the learner nothing.

### D5 — The overlay is a dialog by role, not by mechanism

`LessonVideoResumeOverlay` is an ordinary component at
`src/components/lesson-view/lesson-video-resume-overlay/`, absolutely positioned to
fill the player box, with `role="dialog"`, `aria-modal="false"`,
`aria-labelledby`/`aria-describedby` pointing at its own heading and description, and
`autoFocus` on the Resume button.

*Why:* the visual and semantic goals pull apart here. It must *not* be modal (no
backdrop, no page-wide `aria-hidden`, no portal), which rules out Radix's `Dialog` —
the primitive's entire value is the behavior we are removing. But a screen-reader user
still needs to be told a decision has appeared and be taken to it, which is what the
role plus autofocus give. It stays keyboard-escapable via its own `keydown` handler.

Consequence: this surface leaves `src/components/modals/`. The `ui-dialog-primitive`
requirement that "every modal is a NiceModal" is unaffected — this stops being a modal.

*Alternative considered:* Radix `Dialog` with `modal={false}` inside a positioned
container. Radix still portals to `document.body`, so keeping it inside the player box
means fighting the portal with a container prop and re-deriving the position — more
moving parts than the ~30 lines it would save.

### D6 — Suppress the player's keyboard shortcuts while the overlay is up

`<MediaPlayer keyDisabled={overlayIsOpen}>`.

*Why:* Vidstack's default shortcuts bind `Space`/`k` to play-pause and arrows to seek
at the player level. With the overlay focused, `Space` on the Resume button would both
activate the button and toggle playback. Disabling the player's own key handling for
the lifetime of the overlay leaves the two buttons and `Escape` as the only keys that
do anything.

### D7 — The title cover yields to the overlay

`LessonView` already retires the gold cover on the first `play` via `onPlaybackStart`.
Since the overlay is opened by that same first play, the cover is already gone when the
overlay paints, and its `pointer-events-none` means it never intercepted clicks anyway.
The overlay is rendered inside `<MediaPlayer>` while the cover is a sibling of the
player in `LessonView`, so the overlay is given a z-index above the player box's
content and the ordering is asserted by an e2e check rather than left to source order.

### D8 — Vidstack's labels come from `next-intl`

`<DefaultVideoLayout translations={...}>` takes a `DefaultLayoutTranslations` map. A
`src/components/lesson-view/lesson-video-player/` local helper builds it from a new
`Components.VideoPlayer` message namespace, typed as `DefaultLayoutTranslations` so
TypeScript reports any key the library adds or renames on upgrade.

The `Components.NativeVideoPlayer` namespace is renamed to `Components.LessonVideoPlayer`
(`videoPlayerLabel`, `playbackRate`) and `Components.LessonVideoResumeModal` to
`Components.LessonVideoResumeOverlay` (same four keys plus `resumeFrom`), in all three
locale files, so no namespace outlives the component it named.

### D9 — Component boundaries after the change

| Component | Responsibility |
| --- | --- |
| `LessonVideoPlayer` | `<MediaPlayer>` + `<MediaProvider>` + `<DefaultVideoLayout>`; takes `source`, `poster`, `title`, `ariaLabel`, `keyDisabled`, `ref`, and `children` (the in-player overlay slot) |
| `LessonVideoResumeOverlay` | Presentational: `positionSeconds`, `onResume`, `onRestart`; owns its own `Escape` handling and autofocus |
| `useResumeOnFirstPlay` | The rule: one-shot guard, threshold gate, the three outcomes |
| `PlaybackPositionedVideoPlayer` | Persistence wiring + composition: reads the saved position, owns the player ref, renders the overlay into the player's children |

`NativeVideoPlayer` and `LessonVideoResumeModal` (with their tests and stories) are
deleted, not deprecated — nothing else imports them.

## Risks / Trade-offs

- **Vidstack's custom elements in jsdom.** `@vidstack/react` registers web components
  and probes for media capabilities; a component test that mounts `<MediaPlayer>` may
  warn or fail to reach `canPlay`. → D3 keeps every rule under test out of the player:
  the hook is tested against a stub, the overlay is tested as plain markup, and the
  `LessonVideoPlayer` component test asserts only that it renders and passes its props
  through, with the real playback path covered by Playwright.
- **A play-through window before the pause lands.** → The frames in question are at
  `0`, behind the overlay. If it proves visible in the e2e run, the fallback is to
  `pause()` on `onCanPlay` as well, before any play request exists.
- **The default layout will not match the cinema theme out of the box.** → It is
  themed through CSS variables on `.vds-video-layout`, mapped to the project's existing
  tokens. Scope is a colors/radii pass, not a re-skin; anything beyond that is a
  follow-up change.
- **Bundle size.** `@vidstack/react` is materially larger than a `<video>` tag. → The
  player is already inside a `"use client"` leaf on one route; the cost lands on the
  Lesson Page only, and buys the chrome, keyboard handling, and ARIA we would otherwise
  hand-write.
- **A learner who only wanted to skim the notes now sees the overlay only if they hit
  play.** That is the intended trade: the overlay's audience shrinks to people who
  actually asked to watch.

## Migration Plan

No data migration — the `localStorage` key and its value are unchanged, so a position
saved by the old player is offered by the new one on the learner's next play.

Message-file rename is the only breaking step for translators, and all three locale
files change in the same commit. There is no feature flag: the two players cannot
coexist without keeping both dependencies and both prompts alive, which is more risk
than the swap itself. Rollback is a revert of the change.

## Testing strategy

TDD throughout — a failing test precedes every production line, per `AGENTS.md`.

| Behavior | Layer | Where | Mirrors |
| --- | --- | --- | --- |
| One-shot guard; threshold gate; resume/restart call `seekTo` then `play`; `handlePlay` pauses only when an offer is pending | **Vitest unit** (`renderHook`) against a stub player with three spies | `src/hooks/use-resume-on-first-play/use-resume-on-first-play.test.ts` | `src/hooks/use-playback-position/use-playback-position.test.ts` |
| Overlay renders the formatted position, the two actions, `role="dialog"` and its accessible name; Resume/Restart fire their callbacks; `Escape` fires the restart callback; focus lands on Resume | **Vitest component** (RTL + `user-event`) | `src/components/lesson-view/lesson-video-resume-overlay/lesson-video-resume-overlay.test.tsx` | `src/components/modals/lesson-video-resume-modal/lesson-video-resume-modal.test.tsx` (adapted — no `NiceModal` harness) |
| Player passes `source`/`poster`/`title`/`ariaLabel` through and renders its `children` slot inside the player box | **Vitest component** (RTL, shallow assertions only) | `src/components/lesson-view/lesson-video-player/lesson-video-player.test.tsx` | `src/components/lesson-view/native-video-player/native-video-player.test.tsx` |
| Persistence: no write before interaction, debounced `timeupdate` writes, immediate write on pause/seeking/ended, flush on unmount | **Vitest component** with a stubbed player handle | `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.test.tsx` (rewritten off the DOM-event harness) | the existing file's structure |
| Full flow in a real browser: land → nothing shown; press play → paused with overlay inside the player bounds; Resume → `currentTime` at saved + playing; Restart → `0` + playing; `Escape` → `0` + playing; second play → no overlay; page behind the player still interactive | **Playwright e2e** | `e2e/lesson-playback-resume.spec.ts` (rewritten) | the existing file's seed-derived fixture selection and `addInitScript` storage reset |
| Visual review of the overlay over the player, both locales and both themes | **Storybook** | `lesson-video-resume-overlay.stories.tsx`, `lesson-video-player.stories.tsx` | `LessonView/*` stories |

The e2e suite is the only place a real `play()` is exercised; it is also the only place
the "overlay is inside the player box, not over the page" claim can be checked, via a
bounding-box comparison between the overlay and the player element.

## Resolved at implementation

### R1 — The package is pinned to `@vidstack/react@1.15.6`, not `latest`

npm's `latest` dist-tag for `@vidstack/react` still points at **0.6.15** (2023); the
1.x line ships under the `next` tag, currently `1.15.6`. `pnpm add @vidstack/react`
therefore installs a version with **no** `./player/layouts/default` export and no
stylesheets — every API this design depends on is 1.x only. The dependency is pinned to
an exact `1.15.6` rather than a caret range, so a lockfile refresh cannot silently walk
back to the 0.x line.

### R2 — `DefaultLayoutTranslations` is a closed 56-word map; we supply all of it

`type DefaultLayoutTranslations = { [word in DefaultLayoutWord]: string }` over 56
literal words. The `translations` prop accepts `Partial<…> | null`, but our factory's
return type is the **full** `DefaultLayoutTranslations`, so a Vidstack upgrade that adds
or renames a word fails `pnpm typecheck` instead of silently rendering English to a
Spanish learner. The words are the English source strings themselves (`'Play'`,
`'Enter Fullscreen'`, `'Closed-Captions Off'`, …), which makes them poor JSON keys — so
`Components.VideoPlayer` uses kebab-case keys and the factory maps key → word in one
place.

All 56 are translated even though the layout only surfaces a subset for our content
(no captions, chapters, quality, Cast, or AirPlay ship in this change). Translating the
unreached ones costs three JSON entries each and removes the question of which words a
future feature would expose untranslated.

### R3 — Persistence moves into its own headless hook too (amends §D9)

§D9 left position persistence inside `PlaybackPositionedVideoPlayer`, where it
lives today, on the assumption that the wrapper's test could keep driving it. It
cannot. Two jsdom facts, both measured:

1. Vidstack's React callbacks fire only for events dispatched through
   `player.dispatchEvent(...)` — the instance method. Dispatching the same event on
   `player.el`, which is the very same element, reaches raw `addEventListener`
   subscribers but never the React props.
2. `play()`, `pause()`, and `currentTime =` are inert without a loaded provider, and
   the provider loads behind an `IntersectionObserver` that never fires under test.
   The player reports `currentTime` as `0` no matter what is asked of it.

So a wrapper test could *deliver* the events but could never observe the position
they are supposed to persist. Persistence therefore moves to
`src/hooks/use-persist-playback-position/`, taking a structural
`{ readonly currentTime: number }` and returning the handlers to bind — the same
shape, and the same reason, as `useResumeOnFirstPlay` in §D3.

`PlaybackPositionedVideoPlayer` is left as pure composition: two hooks, one player,
one conditional overlay. Its own test asserts only that composition. No specified
behavior changes — the debounce window, the immediate-write events, the interaction
gate, and the flush-on-unmount rule are all still the `playback-position` spec's, just
enforced one layer down where they can actually be asserted.

### R4 — The `MediaPlayer` props this design names all exist

`src`, `poster`, `title`, `viewType`, `playsInline`, and `keyDisabled` are all real
`MediaPlayerProps` on 1.15.6, and `keyDisabled` is a plain boolean — D6's "suppress
shortcuts while the overlay is open" is a single bound prop, not a workaround.

### R5 — Three of the Default Layout's defaults are wrong here, and browser review caught them

None of these surfaced in any test. They were found by opening the page and looking at
it, which is why that step is in the task list.

1. **The layout draws no poster.** `DefaultVideoLayout` contains no `Poster` in its
   tree at all — Vidstack expects one composed inside `<MediaProvider>`. Setting the
   player's `poster` prop is necessary but not sufficient: every lesson with a
   thumbnail rendered a black idle frame, a straight regression from
   `<video poster>`. Fixed by rendering `<Poster>` in the provider outlet.
2. **The chrome followed the OS, not the app.** `colorScheme` defaults to `system`,
   and this app's toggle is its own binary dark-first setting that ignores the OS —
   so the player sat in light mode inside a dark page. Fixed by driving it from
   `next-themes`' `resolvedTheme`.
3. **Desktop got the phone layout.** The default `smallLayoutWhen` is
   `width < 576 || height < 380`, and a 16:9 player in the lesson column is about
   360px tall on a 1440px desktop — so every desktop learner got the compact mobile
   chrome. Fixed by breaking on width alone.

## Open Questions

- Whether the `pointer-events-none` title cover needs an explicit z-index bump against
  the overlay. **Resolved in practice, not by the planned assertion**: the seed lesson
  used for e2e carries a `poster`, so the cover never renders for it, and D7's
  ordering (the cover is retired by the first `play`, which is the same event that
  opens the overlay) means the two are never visible together. The e2e run confirms
  the overlay's box sits inside the player's. A poster-less lesson would be the case
  to watch if the cover rule ever changes.
