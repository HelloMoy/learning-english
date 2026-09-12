## Context

Completion has two producers, and both already funnel through one writer,
`markLessonComplete` in `use-lesson-completion`: the manual control
(`LessonCompletionToggle.onMark`, after its Server Action confirms) and the finish rule
(`useCompleteWhenWatched.handleProgress`, gated by a `hasMarkedRef` so it writes once
per session).

The visual vocabulary is Immersion Cinema: gold `#e7b64c` and amber `#f0c869` over a
near-black page, with a cream `#f4f1ea` ink. The project has no animation library and
no celebration surface yet.

## Goals / Non-Goals

**Goals:**

- One celebration, fired from one place, for both producers.
- Fires on the transition only — never on load, never on a rejected write, never twice.
- Reduced motion respected; completion information never depends on the animation.
- The library stays out of the bundle of every page that never celebrates.

**Non-Goals:**

- Module or course celebrations, sound, or a user-facing on/off setting.
- Changing what completion is or how it is written.

## Decisions

### D1 — Fire at the two call sites, not from the completion store

`celebrateLessonCompletion()` lives in `src/lib/celebrate-completion/` and is called by
the toggle (after a confirmed mark) and by `useCompleteWhenWatched` (right where it
writes).

*Why not inside `markLessonComplete`:* that function is the store's writer, and a
visual side effect there would fire for any future caller — a backfill, a migration, a
"mark all as complete" — and would make a data function depend on the DOM.

*Why not a `useEffect` watching the completion snapshot:* it reads as the tidier
option, but the snapshot's first value after hydration is exactly the transition
false → true for a lesson that was already complete, so a page load of a finished lesson
would fire confetti. Distinguishing that from a real completion needs a baseline flag
whose correctness depends on effect ordering. The two call sites are the moment itself,
with no ambiguity to encode.

*Consequence, accepted:* a future third producer must remember to call it. The shared
function keeps that to one line, and the capability spec names the rule.

### D2 — The library is imported dynamically

`celebrateLessonCompletion` does `await import("canvas-confetti")` inside the call.

*Why:* the Lesson Page is not the only route, and nothing else celebrates; a static
import puts the library in the shared client bundle. The dynamic import also makes the
function trivially mockable in tests.

*Failure is swallowed:* the whole call is wrapped so a failed chunk load or a draw
error cannot reject into a caller that has already written the completion. This is the
one place a silent catch is right — the alternative is an exception thrown over
successful work, for decoration.

### D3 — Reduced motion is delegated to the library

The burst passes `disableForReducedMotion: true` rather than reading the media query in
our own code.

*Why:* `canvas-confetti` already implements the check, and re-implementing it would add
a second, possibly divergent, definition of the same preference.

### D4 — The burst uses the cinema palette, twice, from the lower corners

Two symmetric bursts from the lower left and lower right, in gold, amber and cream.

*Why:* a single centre burst reads as a generic web celebration; the corners keep the
middle of the page — where the completed state and the next lesson are — clear, which
is also what keeps the celebration non-blocking. The colours are literal hex rather than
CSS variables because the library draws on a canvas, and they are chosen from the family
that reads on both the light and the dark ground.

## Risks / Trade-offs

- **[A third producer of completion forgets to celebrate]** → the spec states the rule
  and both existing call sites are one line apart from the writer they follow.
- **[jsdom has no canvas, so a test that really drew would fail]** → the library is
  mocked at the module boundary in every test; nothing draws in the suite.
- **[The dynamic import resolves after the component unmounts]** → nothing in the
  celebration touches component state, so a late resolution is harmless.
- **[Confetti over a paused video looks like a glitch on a slow device]** → the burst
  is short and `disableForReducedMotion` covers the accessibility case; if it proves
  annoying, the fix is one function.

## Testing strategy

| Layer | File | Covers |
| --- | --- | --- |
| Vitest unit | `src/lib/celebrate-completion/celebrate-completion.test.ts` (new) | It loads the library on demand and fires a burst with `disableForReducedMotion`; a rejected import or a throwing burst resolves instead of rejecting. |
| Vitest + RTL | `src/components/lesson-view/lesson-completion-toggle/lesson-completion-toggle.test.tsx` (extend) | A confirmed mark celebrates; a Server Action that resolves without `data` does not; confirming an un-mark does not. |
| Vitest | `src/hooks/use-complete-when-watched/use-complete-when-watched.test.ts` (extend) | Crossing the finish threshold celebrates; further progress events past it do not celebrate again; a lesson opened past the threshold without playback does not celebrate. |

Every task is TDD: the failing test named here is written before the production code it
describes, per `AGENTS.md`.
