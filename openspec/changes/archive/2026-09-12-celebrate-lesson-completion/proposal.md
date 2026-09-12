## Why

Finishing a lesson is the moment the course rewards. Today it passes in silence: a
button swaps for a line of text, or a progress bar quietly fills. On a 107-lesson
pronunciation course, where progress is slow by design, that moment is the main thing
telling a learner they are getting somewhere — it should feel like something.

## What Changes

- Completing a lesson fires a **confetti burst** over the page, using
  [`canvas-confetti`](https://www.kirilv.com/canvas-confetti/).
- It fires for **both** producers of completion, because both are the same moment for
  the learner: tapping "Mark as complete", and playback crossing the lesson's finish
  threshold in the player.
- It fires only on the transition into completion: never on page load for a lesson that
  was already complete, never when the Server Action rejects the write, and never when
  the learner un-marks a lesson.
- It respects `prefers-reduced-motion`: a learner who asked their system for less motion
  gets the completion state without the animation.
- `canvas-confetti` joins the dependencies, loaded on demand so it stays out of the
  bundle every other page pays for.

## Non-goals

- No sound, no haptics, no toast, no full-screen takeover.
- No celebration for finishing a module or a course — this change is the lesson moment
  only. (Worth doing later, and deliberately not bundled in here.)
- No setting to turn the confetti off beyond the system's reduced-motion preference.
- No change to what completion *is*, who records it, or any of the two write paths.

## Capabilities

### New Capabilities

- `lesson-completion-celebration`: when the celebration fires, when it must not, and the
  accessibility rule that governs it.

## Impact

- `package.json` — `canvas-confetti` and its types.
- `src/lib/celebrate-completion/` — new: the one place that knows how the celebration
  looks, loading the library on demand.
- `src/components/lesson-view/lesson-completion-toggle/lesson-completion-toggle.tsx` —
  celebrates after a confirmed mark.
- `src/hooks/use-complete-when-watched/use-complete-when-watched.ts` — celebrates when
  the finish threshold marks the lesson.
- No domain, port, adapter or use-case change: the celebration is a delivery concern.
