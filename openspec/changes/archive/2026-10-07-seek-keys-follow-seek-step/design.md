## Context

`PlaybackGestures` owns the seek run. A double tap on an edge is detected by a Vidstack
`<Gesture>`, cancelled in `will-trigger`, and handed to `seekOneStep(direction, trigger)`,
which asks `useSeekRun` for the target (`anchor ± steps × step`, the step read from
`useSeekStep`) and performs `remote.seek`. While a run is active `SeekFeedback` is drawn
and every gesture is disabled.

The keyboard never reaches any of that. What the library does with a seek key
(`@vidstack/react` 1.15.6, `core/keyboard/controller.ts`):

- `MEDIA_KEY_SHORTCUTS` binds `seekBackward` to `j J ArrowLeft` and `seekForward` to
  `l L ArrowRight`. The controller listens on the **player element** (bubble phase), and
  only while focus is inside it.
- On **keydown** it forwards a synthetic `Left` / `Right` key to the time slider, which
  previews a move of its own `keyStep` — the Default Layout's `seekStep`, ten seconds —
  and then sets `lastKeyboardAction`, which is what makes `DefaultKeyboardDisplay` paint
  its arrows. It sets that even when the video cannot be seeked.
- On **keyup** it commits: through the slider when it found one on keydown, otherwise
  `remote.seek(this.#seekTotal)`.
- It ignores a key whose focused element matches
  `input, textarea, select, [contenteditable], [role^="menuitem"], [role="timer"]`.
- A focused slider handles its own arrows before the controller sees them, and stops the
  event there.

`useSpeedHold` already takes the play/pause key away from this controller, with a
`keydown` listener on the document in the capture phase, and records why the library's
own shortcut table could not be relied on to do it.

## Goals / Non-Goals

**Goals:**

- A seek key moves the video by the learner's step and is answered by the seek
  indicator.
- One path for every seek in a run — tap, run tap or key — so the anchor arithmetic and
  the step a run carries hold for all three.
- The library's keyboard display never paints for a seek key, in any state.
- The keys stay with whatever element owns them: a text field, a menu, the volume slider.

**Non-Goals:**

- A `Shift` multiplier, a keyboard-only step, seek buttons, shortcuts while focus is
  outside the Player, any change to the other keys — all in the proposal's Non-goals.

## Decisions

### D1. The keys are taken in the capture phase on the document, not through `keyShortcuts`

`<MediaPlayer keyShortcuts>` can carry a handler per action, and it is the declarative
way. It is not used, for the reason `useSpeedHold` already found and for one more: with
the action removed from the table, a focused **time slider** still handles the arrows
itself, at the layout's ten seconds, and that is exactly where focus rests after a click
on the timeline. A capturing listener on the document runs before both the slider and
the controller, so one listener covers every focus position inside the Player.

_Alternative considered:_ leave the keys to the library and pass the learner's step as
`DefaultVideoLayout`'s `seekStep`. That would fix the amount and nothing else — the
library's display would still be the answer, and its seek commits on keyup, outside the
run.

### D2. Keydown **and keyup** are swallowed

Stopping only the keydown leaves the library a keyup it never saw the start of. Its
keyup handler then finds no slider remembered from keydown and calls
`remote.seek(undefined)`. So the hook stops both, for exactly the events it would have
taken on keydown.

### D3. A new hook, `useSeekKeys`, that reports a direction and knows nothing else

`src/hooks/use-seek-keys/use-seek-keys.ts`, shaped like `useSpeedHold`: it takes the
player (by its `{ el }` shape, not the library's type), an `enabled` flag and an `onSeek`
callback held in a ref, and it owns three things — which keys, which focus, and
swallowing the event. `PlaybackGestures` decides whether a seek may happen and performs
it through `seekOneStep`.

The keys are spelled in the hook as `SEEK_KEYS`, keyed by direction, and a test pins them
to `MEDIA_KEY_SHORTCUTS.seekBackward` / `.seekForward` — the arrangement `HOLD_KEYS`
already uses to stay free of the library without drifting from it.

_Alternative considered:_ fold the keys into `useSpeedHold`, which already has the
listener. That hook reports a hold; a second, unrelated responsibility behind the same
boolean is the wrong shape, and its `enabled` means "a hold may start", which is false
exactly when a paused learner presses an arrow.

### D4. Swallowing and seeking are two decisions

The hook swallows a seek key whenever `enabled` is true and the key is the Player's,
whether or not a seek follows. `PlaybackGestures` seeks only when the video can be seeked
and no speed hold is active.

- `enabled` is `!keyDisabled`. With the shortcuts suppressed the library ignores the key
  too, so nothing changes for the resume offer: the key is left entirely alone.
- **Not seekable:** the key is swallowed and nothing is drawn. Left to the library it
  would not seek either, but it would still paint its arrows.
- **Speed hold active:** swallowed, no seek. A run would lower the hold's `enabled` and
  end it mid-press, and the pointer release that follows would then be read by the run's
  own tap listener as a tap on whichever band the finger was resting on. A hold blocks a
  run for the same reason a run blocks a hold.

### D5. Which focus keeps the keys

Focus must be inside the Player — the library's own rule under its default `keyTarget`.
Inside it, the keys are left to an element matching the library's ignore list, plus any
`[role="slider"]` **except** the time slider (`[data-media-time-slider]`):

- the volume slider's arrows change the volume, and must keep doing so;
- the time slider's arrows are the very seek this change is about, so taking them there
  is the point — see D1.

A focused button does not keep them: arrows do nothing on a button, and after a click on
play that is where focus is.

`Meta`, `Ctrl` and `Alt` leave the key to the browser (`Alt+←` is "back"). `Shift` does
not, because `J` and `L` arrive with it; it changes nothing about the step.

### D6. A repeat is a step

A held key repeats, and each repeat is handed over like a press. The run already targets
`anchor ± steps × step`, so a provider that has not applied the previous seek cannot make
a repeat lose a step — the property the run was built for. The platform's repeat delay
(about half a second) is inside the run's 700 ms window, so the run does not lapse
between the first press and the first repeat.

_Alternative considered:_ ignore repeats, one press one step. It makes "hold to scrub",
which every video player answers, do nothing after the first step.

### D7. `keyDisabled` reaches the gestures as a prop

`LessonVideoPlayer` already receives it and hands it to `<MediaPlayer>`; it now hands it
to `<PlaybackGestures>` too. Reading it back from the player instance inside the listener
would work, but a prop keeps the dependency visible and the gesture testable without the
instance.

## Risks / Trade-offs

- **A click within the run's window after a key press is the run's.** A run started from
  the keyboard disables the gestures like any other, so a click on the middle band in the
  700 ms after the last press is absorbed rather than pausing. → Accepted: it is the rule
  the run already has, and one run with two entrances is simpler than two kinds of run.
- **A held key sends a seek per repeat to a YouTube embed.** → The requests are
  idempotent targets, not increments, so the last one wins; verified in the browser on a
  YouTube-sourced lesson as part of the tasks.
- **`Shift`+arrow loses its doubled step.** → Named as a non-goal; the learner's step is
  the unit, and the run adds steps by pressing again.
- **The time slider's arrows stop previewing on the slider thumb before commit.** → The
  seek is immediate instead, and the thumb follows `currentTime` as it does after a tap.

## Testing strategy

- **Vitest unit — `src/hooks/use-seek-keys/use-seek-keys.test.ts`**, mirroring the
  key section of `use-speed-hold.test.ts` (a detached player element with focus,
  `fireEvent.keyDown(document, …)`, the return value of `fireEvent` as the "was it
  swallowed" probe): each key reports its direction; repeats report again; keydown and
  keyup are both cancelled; a modifier, another key, focus outside the player, and focus
  on a key owner all leave the key alone; the time slider does not keep it; `enabled:
  false` leaves it alone.
- **Vitest component — `lesson-video-player.test.tsx`**, extending the double-tap
  harness (real library, mocked `useMediaRemote` / `useMediaState`): an arrow asks the
  remote for one step and raises the indicator on that side; a second press extends the
  run; a stored step governs it; nothing is asked while not seekable, while the shortcuts
  are suppressed or while a hold is active; the library's `lastKeyboardAction` stays
  unset for a seek key, with a control key proving that assertion can fail; `SEEK_KEYS`
  matches the library's table.
- **Playwright e2e — `e2e/lesson-video-player.spec.ts`**, in the desktop `describe`
  beside the double-click cases: an arrow press moves `currentTime` by the default step
  and shows the indicator; a chosen step governs it; an arrow after a click on the
  timeline still seeks one step; the library never records a seek key as its own
  shortcut, with a control key showing that it records the ones it handles. That state —
  `lastKeyboardAction` — is what its display paints from, and it is asserted instead of
  the display because the display is on screen for 500 ms. This is the layer that proves
  D2 — jsdom dispatches no seek at all.
- **By hand, Playwright MCP:** a held arrow on a YouTube-sourced lesson, and an arrow
  press with focus left on the time slider after a click on the timeline.
