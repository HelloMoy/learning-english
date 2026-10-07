## Why

The learner can choose how far a seek reaches — 3, 5 or 10 seconds, from the Player's
gear menu — but only the double tap listens. The arrow keys still belong to the library:
they move the video by the Default Layout's own ten seconds whatever the menu says, and
they answer with the library's keyboard display, a pair of arrows in the middle of the
frame that names no amount. So a learner who set three seconds to replay a single word
gets three seconds from a thumb and ten from a keyboard, and two different pictures for
what is one action.

The seek run and its indicator already exist, already count in the learner's step and
already read correctly to assistive technology. The keys only have to join them.

## What Changes

- The Player's **seek keys seek by the learner's seek step** — the arrow keys, and the
  `J` / `L` pair the library binds to the same two actions — instead of the layout's
  fixed ten seconds. **BREAKING** for the current behaviour: an arrow press on a default
  profile moves five seconds, not ten.
- A seek key **starts or extends a seek run**, exactly as a tap on that edge does: the
  same anchor arithmetic, the same lapse window, the same turn-around when the other
  direction is pressed, the same step carried for the run's life.
- The **seek indicator is what answers a seek key** — the half-disc, the chevrons and
  the running count of seconds the double tap already draws. The **library's keyboard
  display is no longer drawn for these keys**; it stays for the keys this change does
  not touch (volume, mute, fullscreen, captions, speed).
- A **key held down keeps seeking**: every repeat the platform sends adds a step to the
  run, so the count climbs while the key is down.
- The keys are taken **only where they are the Player's**: keyboard focus inside the
  Player, no browser modifier held, and not on an element that owns the arrows itself —
  a text field, an open menu's items, the volume slider. Focus on the **time slider**
  does not keep them: a click on the timeline leaves focus there, and the next arrow
  press must still mean one step.
- The keys do nothing — and draw nothing — while the Player's shortcuts are suppressed
  (the resume offer is open), while the video cannot be seeked, and while a speed hold is
  active.

## Capabilities

### New Capabilities

_None._ The keys are another way into the Lesson Player's existing seek run, whose
behaviour `lesson-page` already specifies.

### Modified Capabilities

- `lesson-page`: a new requirement, "The seek keys seek by the learner's step and draw
  the seek indicator", and a change to "The learner chooses how far a double tap seeks",
  which today applies the chosen step to the double tap only and now applies it to the
  seek keys as well.

## Impact

- New `src/hooks/use-seek-keys/` — takes the seek keys from the library in the capture
  phase and reports a direction; no player or run knowledge.
- `src/components/lesson-view/lesson-video-player/playback-gestures.tsx` — hands a seek
  key to the same `seekOneStep` the double tap and the run's taps already use.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — passes
  `keyDisabled` on to the gestures, so the keys fall silent with the rest of the
  shortcuts.
- JSDoc that says the step is the double tap's alone: `seek-run.ts`, `use-seek-step.ts`,
  `seek-step-menu.tsx`, `seek-feedback.tsx`.
- Tests: new `use-seek-keys.test.ts`; `lesson-video-player.test.tsx`;
  `e2e/lesson-video-player.spec.ts`.
- No new dependency, no new copy: the indicator's strings and the menu's label ("Seek
  step" / "Salto") already say nothing about a tap.

## Non-goals

- **No `Shift` multiplier.** The library doubled the step under `Shift`; a run counts in
  one step, the learner's. `Shift` is ignored rather than refused, since `J` and `L` are
  typed with it.
- **No change to the other shortcuts.** Volume, mute, fullscreen, captions, speed, the
  number keys and the play/pause key keep what they do today, the library's keyboard
  display included.
- **No change to the time slider's own keys** beyond the two arrows — `Home`, `End`,
  `PageUp`, `PageDown` and the vertical arrows on a focused slider stay the library's.
- **No seek buttons.** The Default Video Layout draws none, and this change adds none.
- **No new setting.** One step governs the tap and the keys; there is no separate
  keyboard step.
- **No change to the run's rules or the indicator's look** — window, anchor, turn-around,
  absorbed middle tap, copy and motion stay as specified.
- **No shortcut outside the Player.** The keys act while focus is inside it, which is the
  library's rule today; no document-wide listener is added for a lesson page whose focus
  is elsewhere.
