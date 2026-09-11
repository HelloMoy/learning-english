## Context

`ScrollDownHint` is the pill drawn along the top edge of the enlarged player while
Safari's toolbar still takes part of the screen. Its present shape is the outcome of
`2026-09-09-swipe-hint-arrow-led-copy`, which moved direction out of the words and into a
downward arrow, on the theory that the honest direction is the **page's**: the document
scrolls down, which is what hides the toolbar.

Three artefacts in the codebase encode that theory and will all have to turn:

- `scroll-down-hint.tsx` draws `ArrowDown`, enters with `slide-in-from-top-2`, and runs
  `animate-arrow-drop`. Its JSDoc states the rule twice and explicitly instructs the next
  editor to keep the verb about the page.
- `globals.css` defines `--animate-arrow-drop`: Tailwind's `bounce` mirrored to travel
  down, widened from 25% to 60% because a quarter of a 16px glyph measured as no motion
  on a phone.
- `scroll-down-hint.test.tsx` asserts the downward glyph by class, the downward entrance,
  the travel utility and the bounded `repeat-[6.5]`.

The decision being reversed is a product call, not a technical one, and the owner has
made it twice over. The engineering question is only: when the sentence turns, what else
must turn with it, and what must not.

## Goals / Non-Goals

**Goals:**

- The visible copy asks the learner to move the video up by hand, in all three locales.
- Every directional cue the pill carries — glyph, entrance, repeated travel, spoken
  sentence — points the same way as those words.
- A device that runs the new JS against a cached stylesheet degrades to **no motion**,
  never to motion in the wrong direction.
- The spoken sentence keeps everything the visible line drops, so nothing is lost to a
  screen reader by shortening the pill.

**Non-Goals:**

- Renaming `ScrollDownHint`, its folder, or the `Components.ScrollDownHint` namespace.
  The name describes the mechanism — the page does scroll down — and it stays accurate;
  what changes is which of the two directions the learner is told about. A rename would
  touch the player, three message files and the e2e spec for no behavior.
- Retuning the travel's length or displacement. The motion flips and keeps its shape.
- Changing when the hint shows, how it is dismissed, or that it must not swallow the
  gesture.

## Decisions

### 1. `ArrowUp`, as a glyph — never a rotated `ArrowDown`

Swap the import. No `rotate-180`, no conditional class.

This is the same rule the component already documents, applied in the new direction: an
earlier version drew `ArrowUp` and flipped it in CSS, and shipped a wrong-pointing arrow
on a phone that had the new JS and a stale stylesheet. What CSS carries here is the
motion; a stylesheet that never arrives costs a still arrow, never a wrong one. Lucide's
glyphs are distinguishable in test by their `lucide-arrow-up` / `lucide-arrow-down`
class, so the assertion can sit on the drawn glyph rather than on a utility.

**Alternative rejected:** one `<Arrow>` wrapper taking a direction prop. There is one
call site and one direction; the indirection would buy nothing and hide the glyph from
the test.

### 2. A new `arrow-lift` utility, replacing `arrow-drop` rather than editing it

`globals.css` gets `--animate-arrow-lift: arrow-lift 1s infinite` with keyframes holding
`translateY(-60%)` at `0%`/`100%` and `transform: none` at `50%` — the existing shape,
sign flipped. `arrow-drop` and its keyframes are deleted; `grep` confirms the component
and its test are the only consumers.

**Why a rename and not a sign flip in place.** The stale-stylesheet failure mode decides
it. If `arrow-drop` kept its name and changed direction, a phone holding the old CSS
would run *downward* travel beside the new upward arrow and the new copy — two cues
disagreeing, the exact defect. Under a new name, that same phone finds no such utility,
the class resolves to nothing, and the arrow sits still pointing up. Degrading to a still
arrow is the outcome this component has already chosen once; renaming is what makes CSS
inherit it.

**Why not Tailwind's built-in `animate-bounce`,** which already travels up: its
displacement is 25%, which on a 16px glyph is four pixels — the existing comment records
that as measuring like no animation at all on a phone. The 60% is the reason this project
has a custom keyframe in the first place, and that reason is direction-independent.

**The half-iteration stays load-bearing.** `repeat-[6.5]` works only because the keyframe
holds the *displaced* position at both ends and rests in the middle; a whole number would
end the run held out and snap the arrow into place in one frame. The new keyframe must
keep that structure — displaced at `0%`/`100%`, at rest at `50%` — and it does, since only
the sign changes.

### 3. The entrance travels up: `slide-in-from-top-2` → `slide-in-from-bottom-2`

The spec requires the hint to "enter travelling the way the arrow points", and the
component test pins it. `slide-in-from-bottom-2` starts the pill 8px below its resting
place and lifts it in. The pill stays anchored at `top-3` of the player box; only the
8px of entrance travel reverses, so nothing about the layout moves.

### 4. The visible line carries the gesture; the spoken line carries everything

`Arroja el video hacia arriba` (es) / `Drag the video up` (en) /
`Arremesse o vídeo para cima` (pt).

The outcome — "pantalla completa" — leaves the visible line because gesture plus outcome
does not hold one line at phone widths in Spanish or Portuguese, and `whitespace-nowrap`
turns an overlong string into a pill that overflows the video rather than wrapping. The
learner reading it pressed the enlarge button seconds ago and already knows what they are
chasing; the gesture is the part they do not know.

Nothing is lost to assistive technology, because the hidden sentence is where the full
statement lives — gesture, direction and outcome:

- es — `Arroja el video hacia arriba para verlo en pantalla completa.`
- en — `Drag the video up to see it on the whole screen.`
- pt — `Arremesse o vídeo para cima para vê-lo em tela cheia.`

**On the verb, and why it is not one verb.** The constraint each locale inherits is
narrow: the verb acts on the video and never on the page. Which verb of the hand satisfies
it is a matter of how that language actually asks for a gesture, and the owner chose
differently per locale — Spanish takes `arrojar`, a verb of throwing an object rather than
the platform's `deslizar`/`arrastrar`; English takes `drag`, the ordinary touch verb.
Both are mechanically sound, because a flick's momentum scrolls the document exactly as a
slow drag does and either is all Safari needs to hide its toolbar. Portuguese currently
takes `arremessar`, the literal counterpart of the Spanish; with English on `drag`,
`arraste` is the reading that would pair with it instead, and `jogar` the colloquial
throw. Nothing in the spec or the guard decides between them — `messages.test.ts` only
keeps the scroll verbs out.

**On the direction word returning.** The word is anchored: it is the *video* that goes
up, and "up" said of an object on screen resolves in any orientation, which a bare "up"
does not. That anchoring is the mitigation for the landscape ambiguity that produced the
old wording, and it is why the spec now permits a direction word only in this form.

### 5. The three prose artefacts that argue for the old rule get rewritten, not patched

The component JSDoc, the `globals.css` comment above the keyframe, and the story
docblocks each spend a paragraph explaining why the page's direction wins. Left in place
beside upward cues they become instructions to undo this change. Each gets rewritten to
argue the new rule and to keep the part that survives it: one direction, one cue's worth,
carried by the glyph and not by a class.

While rewriting the story docblock, its "about four and a half seconds" is corrected to
match the 6.5 one-second iterations the component actually runs.

## Risks / Trade-offs

- **The landscape ambiguity the old copy escaped comes back** → Mitigated by anchoring
  the direction to the video rather than leaving it bare, and by the arrow now agreeing
  with the word instead of contradicting it. A learner who misreads "arriba" still has an
  arrow pointing the same way, which is strictly better than the pre-2026-09-09 state
  where the words were the only cue.
- **A cached stylesheet meets new JS** → Mitigated by decision 2: the renamed utility
  resolves to nothing rather than to downward motion, so the failure is a still arrow.
- **`arroja` is an unusual verb for a touch UI and may read as odd** → Accepted; it is
  the owner's explicit choice, made after the alternative (`arrastra`) was on the table.
  The register is consistent across all three locales rather than literal in one and
  idiomatic in the others.
- **Dropping "pantalla completa" from the visible line loses the outcome for a sighted
  learner** → Accepted, and bounded: they are three seconds past pressing a control whose
  accessible name is the outcome. The alternative is a pill that overflows the video it
  is drawn on.

## Testing strategy

- **Vitest + RTL (`src/components/lesson-view/scroll-down-hint/scroll-down-hint.test.tsx`)**
  carries the whole change. The file already has the exact shape needed — a `GIVEN the
  arrow is the only thing naming the direction` block reading the glyph through
  `[data-slot="scroll-direction-arrow"]` — so each assertion turns rather than moves:
  `lucide-arrow-down` → `lucide-arrow-up` (still asserting no `rotate-180`),
  `animate-arrow-drop` → `animate-arrow-lift`, and the entrance class
  `slide-in-from-top-2` → `slide-in-from-bottom-2`. `repeat-[6.5]`,
  `motion-reduce:animate-none`, `aria-hidden`, the `sr-only` sentence, `whitespace-nowrap`
  and the namespace assertion stand unchanged. Its `MESSAGES` fixture holds the real
  Spanish copy on purpose — a hint rendering English defaults fails there — so it takes
  the new strings.
- **Vitest (`src/messages/messages.test.ts`)** is where the copy itself is guarded, and it
  gains one test. The component test cannot do it: it mocks `next-intl` wholesale, so the
  component renders the fixture and the catalogues are never read there. This file already
  makes exactly this kind of cross-locale content assertion — the retired
  season/episode vocabulary regex — and the new one follows it: neither
  `Components.ScrollDownHint` key may carry a verb of scrolling in any locale, because one
  beside an upward arrow is the cue disagreement the change exists to remove. The
  assertion runs over diacritic-normalized text so `Desplázate` is caught by the same
  pattern as `desplaza`. It is red on all three locales before the catalogues are touched.
  The file's existing key-set-drift guard needs no edit: two values are rewritten and no
  key is added.
- **Playwright (`e2e/lesson-video-player.spec.ts`)** reads `Components.ScrollDownHint.message`
  and `.dismiss` straight out of `en.json`, so its appear / auto-leave / dismiss coverage
  follows the new copy without an edit. No new e2e is warranted: what changes is a string
  and four classes, all of which RTL sees.
- **Storybook** is where the motion is judged. `LessonView/ScrollDownHint` stands the pill
  in a dark 16:9 frame; the three locale stories are checked in the browser to confirm the
  pill lifts in, the arrow travels up and rests pointing up, and each locale's line holds
  one line at a phone's landscape width. Reduced motion is checked through DevTools →
  Rendering → Emulate `prefers-reduced-motion`, as the story docblock already directs —
  the hint should be there, still, arrow pointing up, from the first frame.
- No unit test is added for `globals.css`: a keyframe has no behavior a test can read, and
  the utility's presence is asserted through the class the component carries.

## Open Questions

- Portuguese is the one locale whose verb was never chosen deliberately: `arremessar` was
  picked to mirror Spanish back when English mirrored it too, and English has since moved
  to `drag`. The three candidates are `arremesse` (throw, literal — what ships today),
  `arraste` (drag, pairing with English), and `jogue` (throw, colloquial, the most natural
  to a Brazilian learner). It is a one-value change either way and nothing blocks on it.
