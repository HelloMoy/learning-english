## Context

`ScrollDownHint` — `SwipeUpHint` before this change — is a single presentational
component drawn over the pinned Player while
Safari's toolbar still takes part of an iPhone's landscape screen. It already owns the
right responsibilities — `role="status"`, `pointer-events-none` so it cannot swallow the
gesture it asks for, local dismissal, copy from its own translation namespace. What it gets
wrong is the message itself: a full sentence that explains the browser's toolbar and
names, in words, a direction learners were reading against the wrong axis.

Two constraints shape the fix:

- **`src/app/globals.css` is mid-change.** The add-to-home-screen guide owns the
  `guide-*` keyframes currently uncommitted there, so an edit here tangles the two changes
  in one file. Worth avoiding, but not at the price of correctness — see the decision on
  where the direction lives.
- **The hint renders only in landscape on a touch device**, so horizontal room is the
  long side of a phone (≈874pt on a 402×874 iPhone). A three-or-four-word line fits
  comfortably; the old sentence did not.

## Goals / Non-Goals

**Goals:**

- Visible copy short, outcome-first, free of direction words, and built on a verb that
  agrees with the arrow, in `en`, `es`, `pt`.
- Direction carried by a downward glyph that travels downward and stills itself under
  `prefers-reduced-motion`.
- Direction still spoken to assistive technology.
- One line at phone widths, no wrap.
- No new dependency. One keyframe in `src/app/globals.css`, and nothing else outside the
  component.

**Non-Goals:**

- Moving the hint, restyling the pill, changing when it appears, or auto-dismissing it.

## Decisions

### The cue is the scroll, not the finger — and that decides everything else

On an iPhone the two are opposites: the page scrolls **down**, and to make that happen the
finger travels **up**. An arrow can only mean one of them, and the choice is not free —
whichever it means, the verb beside it has to mean the same thing.

The arrow means the **scroll**, and points down. An upward arrow, faithful to the finger,
is what learners were reading wrong: it sits over a video that is not moving, next to a
promise about the screen, and there is nothing on screen for "up" to be up *relative to*.
"Down" has a referent the learner already holds — the page goes down — and it is the word
they would use to describe the action afterwards.

That forces the verb. A swipe verb beside a downward arrow instructs the finger to travel
down, which does nothing here and is the exact two-cues-disagreeing failure this change
exists to remove. So the verb becomes a scroll verb and the pair is consistent: *the page
goes down, and here is the arrow for down.* The motor action a person performs when told
to scroll down is the upward flick, without ever having to think about it.

| Locale | `Components.ScrollDownHint.message` |
| ------ | ----------------------------------- |
| `en`   | `Scroll for full screen`            |
| `es`   | `Baja para pantalla completa`       |
| `pt`   | `Role para tela cheia`              |

The learner does not care that Safari's toolbar is what is in the way; they care that the
video is not filling the screen. Naming the outcome is also what makes the direction word
droppable — "Baja para pantalla completa" is complete without it, whereas "Baja para
ocultar la barra" would beg the question.

### The component is renamed to `ScrollDownHint`

`SwipeUpHint` would now name a component that draws a downward arrow and asks the page to
go down — the name would assert the opposite of the component. The folder, the files, the
translation namespace and the spec wording move with it.

### The hint enters downward with `tw-animate-css`

`tw-animate-css` is already imported by `src/app/globals.css`, so
`animate-in fade-in slide-in-from-top-2 duration-300` costs nothing new. The pill travels
*down* into place — the same direction the arrow points and the page will move. The
entrance is itself a small statement of the axis, before the arrow has said anything.

### The glyph carries the direction; CSS only carries the motion

The first attempt pointed the arrow with `rotate-180` on `lucide`'s `ArrowUp`, which also
turned `animate-bounce`'s upward travel downward. It works — verified in iOS Safari on the
simulator — and it was still the wrong design, for a reason no test would have caught:

**`.rotate-180` appears nowhere else in this codebase.** Before this change the rule did
not exist in the stylesheet at all. So a device holding a cached stylesheet while picking
up the new JS renders the new copy beside an *upward* arrow — the exact defect this change
exists to remove, reintroduced by a stale cache. That is what happened on a real phone
during development.

The direction is not a styling concern. It goes in the markup: the glyph is `ArrowDown`,
which points down whether or not any stylesheet arrives. What CSS carries is only the
motion, and if the motion is missing the hint degrades to a still arrow pointing the right
way — a worse hint, never a wrong one.

### The downward travel is its own keyframe

With no rotation left to borrow, `animate-bounce` — which travels up — no longer fits, so
`arrow-drop` in `src/app/globals.css` states the motion directly: displaced *down* at both
ends of the cycle, at rest in the middle. Same shape as Tailwind's `bounce`, mirrored.

This is the one edit outside the component, and it lands in a file the add-to-home-screen
change is also holding uncommitted. That is a commit-hygiene cost, accepted deliberately:
the alternative was keeping a correctness bet on a brand-new utility class reaching every
device.

`motion-reduce:animate-none` — already the project's idiom in `play-button.tsx` — is a
class the component test can assert without stubbing `matchMedia`.

*Alternative considered:* composing `animate-out slide-out-to-bottom-1 direction-alternate`
from `tw-animate-css` to avoid a new keyframe. Rejected — a named keyframe says what it
does; that chain has to be decoded.

### The travel has to be big enough to see

`bounce` displaces by 25%, which on a 16px glyph is four pixels. Measured on a phone that
is a shimmer, not a cue — the first build of this hint was reported as having no animation
at all, and the measurement agreed: 4px of travel over 4.4 seconds. `arrow-drop` therefore
displaces by **60%**, about ten pixels, and the run is **6.5 iterations** rather than 4.5.

The longer run is not decoration. A learner enlarging a video spends the first seconds
looking at the video, not at the corner; a demonstration that finishes before they look
has demonstrated nothing.

### The travel stops after 6.5 iterations, in CSS, not on a timer

The demonstration is worth about six and a half seconds; after that the learner is
watching a video and the cue should stop competing with it. Two ways to end it:

1. `useEffect` + `setTimeout` that drops the class.
2. `repeat-[6.5]` alongside `animate-arrow-drop` — `repeat-*` is a `tw-animate-css`
   utility over `animation-iteration-count`, so this stays first-class rather than an
   arbitrary property.

**Take the second.** The timer version needs state, an effect, a cleanup, and fake timers
in the test — machinery for something CSS already expresses in one declaration. It is also
*wrong* at the seam: whenever the timer happens to fire, the class disappears mid-cycle
and the arrow snaps from wherever it was back to its resting place.

The fractional count is what avoids that snap, and it is the one line in this change that
will look like a typo to the next reader, so it earns an inline comment. `arrow-drop` puts
the *displaced* position at both `0%` and `100%` and the resting position at `50%`:

```css
@keyframes arrow-drop {
  0%, 100% { transform: translateY(60%); }
  50%      { transform: none; }
}
```

Any whole number of iterations therefore ends the animation held up at `-25%`, and with
the default `animation-fill-mode: none` the arrow drops back into place in a single frame
— a visible twitch on the last beat. Ending on the half-iteration lands the final frame on
`50%`, which *is* the resting position, so the animation and the base style agree and
nothing moves when it stops.

### Reduced motion is honoured on both

`motion-reduce:animate-none` goes on the entrance and on the arrow. Under reduced motion
the hint is simply there, arrow pointing, from the first frame — which is the correct
reading of the preference, not a degraded one.

### The visible line is `aria-hidden`; the screen reader gets its own sentence

The arrow says nothing to a screen reader, so a second, `sr-only` string carries the
direction in words:

| Locale | `Components.ScrollDownHint.screenReaderMessage` |
| ------ | ----------------------------------------------- |
| `en`   | `Scroll down to see the video on the whole screen.` |
| `es`   | `Desplázate hacia abajo para ver el video en pantalla completa.` |
| `pt`   | `Role para baixo para ver o vídeo em tela cheia.` |

Both strings live in the same `role="status"` region, so the short visible line is marked
`aria-hidden="true"`. Without that, assistive technology would read the promise twice —
once clipped of its direction, once with it. The pattern matches
`lesson-completion-mark.tsx`, which already pairs a glyph with an `sr-only` name.

*Alternative considered:* one string for both, keeping the direction word and hiding it
visually with a `<span class="sr-only">hacia abajo</span>` spliced mid-sentence. Rejected
— splicing a sentence across visibility boundaries makes the message untranslatable
without word-order assumptions no locale owes us.

### One line, enforced

`whitespace-nowrap` on the copy. The hint never renders in portrait, so the narrowest
viewport it will ever see is a phone's long side; three or four words cannot overflow it,
and a wrap would be a signal that a locale's copy grew past what this hint is for.

## Risks / Trade-offs

- **"Pantalla completa" promises more than a scroll delivers on a non-iPhone touch device**
  → The hint is already gated on the viewport being shorter than the screen's short
  side, i.e. on browser chrome actually stealing the height. Where the scroll cannot
  reclaim anything, the hint does not render.
- **`animate-bounce` reads as "attention", not strictly as "direction"** → The arrowhead
  supplies the direction; the motion supplies the salience. If the pair still tests
  poorly on a device, the custom travel keyframe is a follow-up once `globals.css` is
  free.
- **Dropping the toolbar explanation loses a teaching moment** → It was never a lesson
  the learner asked for, and the `sr-only` sentence keeps the one fact that matters.

## Testing strategy

| Behavior | Layer | Where |
| -------- | ----- | ----- |
| Visible copy carries no direction word, comes from `Components.ScrollDownHint`, and holds one line | Vitest + RTL | `scroll-down-hint.test.tsx` |
| The glyph is the downward one, animates, stops itself after a bounded run, and carries `motion-reduce:animate-none` | Vitest + RTL | `scroll-down-hint.test.tsx` |
| The hint enters downward and that entrance also respects reduced motion | Vitest + RTL | `scroll-down-hint.test.tsx` |
| The status region announces the directional sentence and does **not** announce the visible line twice | Vitest + RTL | `scroll-down-hint.test.tsx` |
| Dismissal, `pointer-events` split | Vitest + RTL | unchanged tests in `scroll-down-hint.test.tsx` |
| The hint appears/disappears with the viewport on iPhone Safari | Playwright | `e2e/lesson-video-player.spec.ts` — already reads copy from `src/messages/en.json`, so it follows the new strings without new assertions |
| The three locales and a reduced-motion pass render correctly | Storybook | `scroll-down-hint.stories.tsx` |

The component test mirrors the existing file's structure exactly: the `next-intl` mock, a
Spanish `MESSAGES` map so an untranslated default fails here rather than in a lesson, and
`GIVEN/WHEN/THEN` describe blocks. Reduced motion and the bounded run are asserted as
classes, not by stubbing `matchMedia` or advancing fake timers — CSS is what makes both
guarantees, so CSS is what the tests pin. A test that waited 4.5 real seconds to watch the
arrow stop would be neither fast nor repeatable, and one driving fake timers would only be
testing a timer this design deliberately does not have.
