## Why

The double-tap seek moves the video by a step the learner cannot change: ten seconds,
hard-coded in `SEEK_STEP_SECONDS`. Ten seconds is a podcast's step, not a language
learner's — the gesture exists here mostly to replay a phrase that was said too fast, and
ten seconds overshoots it, so the learner taps back, overshoots, taps forward, overshoots
again. A shorter default with a way out is what the material asks for.

The player already has a settings menu (the gear) that owns exactly this kind of
preference — speed, quality, captions — and the app already persists the learner's
choices in `localStorage`. Neither needs inventing; the step just has to join them.

## What Changes

- The **seek step becomes a learner preference** with three values — 3, 5 and 10
  seconds — instead of one constant. **BREAKING** for the current behaviour: the default step
  drops from ten seconds to five, so a returning learner who never opens the menu gets a
  shorter skip than before.
- A **"Seek step" submenu is added to the player's settings menu**, beside Speed, with
  the three values as a radio group and the active one shown as the button's hint.
- The choice is **persisted in `localStorage`** and read back on the next visit, on every
  lesson — it is a player preference, not a per-lesson one.
- The **seek indicator counts in the chosen step**: a run of three taps at 5 s reads
  "15 seconds", at 3 s reads "9 seconds".
- A run in progress **keeps the step it started with**, so a change made mid-run cannot
  rewrite what the indicator already claimed.
- The control and its copy are **localized for `en`, `es` and `pt`** like every other
  string in the player.
- The preference works on **both players the project ships**: the desktop chrome and the
  small (phone) layout that Safari on iPhone gets, including while the video is enlarged.

## Capabilities

### New Capabilities

_None._ The preference belongs to the Lesson Player, whose behaviour `lesson-page`
already specifies; a separate capability would split one control's rules across two
specs.

### Modified Capabilities

- `lesson-page`: the requirement "A double tap on an edge seeks in visible, repeatable
  steps" currently fixes the step at ten seconds declared as a single constant. It
  changes to a learner-chosen step with a five-second default, and gains the rules for
  the settings-menu control, its persistence, and what happens to a run when the step
  changes mid-flight.

## Impact

- `src/lib/seek-run/seek-run.ts` — `SEEK_STEP_SECONDS` is replaced by the allowed option
  list, the default, and a parser; a `SeekRun` starts carrying the step it was started
  with.
- `src/hooks/use-seek-run/use-seek-run.ts` — `tap` takes the step in force.
- New `src/hooks/use-seek-step/` — reads, writes and shares the stored preference.
- New `src/components/lesson-view/seek-step-menu/` — the settings submenu, with its
  stories and tests.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — mounts the
  submenu in the layout's `settingsMenuItemsEnd` slot.
- `src/components/lesson-view/lesson-video-player/playback-gestures.tsx` — reads the
  preference and passes it to the run.
- `src/messages/{en,es,pt}.json` — a `Components.SeekStepMenu` namespace.
- Tests that assert against `SEEK_STEP_SECONDS`: `seek-run.test.ts`,
  `use-seek-run.test.ts`, `lesson-video-player.test.tsx`, `seek-feedback.stories.tsx`,
  `e2e/lesson-video-player.spec.ts`.
- No new dependency: the submenu is built from Vidstack's own exported
  `DefaultMenuButton` / `DefaultMenuRadioGroup`, so it inherits the default theme.

## Non-goals

- **No keyboard shortcut or seek-button change.** The preference governs the double-tap
  gesture only; the layout's own seek buttons and arrow keys keep Vidstack's step.
- **No free-form value.** Three fixed options, not a number field or a slider.
- **No sync across devices.** `localStorage` is per-browser, as every other preference in
  this app is.
- **No per-lesson or per-course override.** One preference for the learner.
- **No change to the seek run's other rules** — the lapse window, the anchor arithmetic,
  the turn-around on the opposite edge and the absorbed middle tap all stay as specified.
- **No settings entry outside the player.** The preference lives in the gear menu, not in
  a separate app settings page.
