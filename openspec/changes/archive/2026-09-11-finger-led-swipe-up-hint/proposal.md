## Why

The hint over the enlarged video currently says `Baja para pantalla completa` /
`Scroll for full screen` / `Role para tela cheia` and points a downward arrow. Both name
the **page**: what reclaims the screen is the document scrolling down. But the page is
the one thing the learner cannot see. The mode pins the player and covers everything
behind it with a backdrop, so the screen holds a video, a black field, and a pill asking
them to "scroll down" — with nothing visibly scrollable and a downward arrow over a video
they just enlarged, the sentence reads as an instruction to shrink it again.

The previous change (`2026-09-09-swipe-hint-arrow-led-copy`) chose the page's direction
deliberately, to escape the landscape ambiguity of the word "arriba". That trade bought
an unambiguous arrow at the cost of a sentence that names something invisible. This
change takes the other side of it: the hint speaks about the object the learner is
actually looking at and the gesture their hand actually makes.

The ambiguity that motivated the old wording is answered differently rather than ignored.
The old copy was *"Desliza hacia arriba"* — a bare direction, which a phone held sideways
gives the learner no way to resolve. The new copy is *"Arroja **el video** hacia
arriba"*: the direction is anchored to a thing on screen, and "up" relative to a video the
learner can see is the same "up" in any orientation.

## What Changes

- **The visible copy names the finger's gesture and its object.** `Arroja el video hacia
  arriba` (es) / `Drag the video up` (en) / `Arremesse o vídeo para cima` (pt). It stays
  one line at phone widths, as it does today.
- **The verb acts on the video, never on the page.** Which verb of the hand each locale
  takes is that locale's own call — English drags, Spanish throws — and both are equally
  sound mechanically, since a flick's momentum scrolls the document exactly as a slow drag
  does, and either is all Safari needs to hide its toolbar. What binds every locale is the
  half that is not a matter of taste: the verb moves the video, and no locale borrows the
  platform's "scroll" vocabulary.
- **The hint commits to the finger's direction instead of the page's.** Every directional
  cue flips with the words, so the pill still says one thing in one voice: the arrow
  points **up**, the pill **enters travelling up**, and the arrow's repeated travel goes
  **up**. A downward arrow beside "arroja hacia arriba" is the same two-cues-disagreeing
  defect the old wording existed to remove, just mirrored.
- **The visible copy may now contain a direction word**, where the current requirement
  forbids it — provided the direction is anchored to something on screen rather than left
  bare.
- **The spoken sentence follows the same voice.** The visually hidden line stops
  describing a scroll and describes the same gesture its locale's visible line does, so a
  learner using a screen reader and a learner reading the pill are told to do the same
  thing.
- **The outcome leaves the visible line.** "Pantalla completa" does not fit beside the
  gesture on one phone line, and the learner who just pressed the enlarge button already
  knows what they are chasing. The visually hidden sentence keeps naming it.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: the requirement governing the enlarged-video hint inverts which
  direction the hint commits to. Today it requires the arrow to point down, the visible
  copy to use a verb of scrolling, and the visible copy to contain no direction word at
  all. It will require the arrow to point up, the copy to use a verb of the hand naming
  the video as its object, and the direction word to be permitted precisely because it is
  anchored to that object. The rules that do not depend on which way is chosen — one
  cue's worth of direction, motion that demonstrates and then stops, reduced-motion
  suppression, the spoken sentence, one line at phone widths — stand unchanged.

## Impact

- `src/messages/{en,es,pt}.json` — `Components.ScrollDownHint.message` and
  `.screenReaderMessage` rewritten in all three locales
- `src/components/lesson-view/scroll-down-hint/scroll-down-hint.tsx` — `ArrowDown` →
  `ArrowUp`, the entrance class, the animation utility, and the JSDoc that documents the
  page-over-finger rule
- `src/components/lesson-view/scroll-down-hint/scroll-down-hint.test.tsx` — the assertions
  that pin the glyph, the entrance and the travel to the downward direction
- `src/components/lesson-view/scroll-down-hint/scroll-down-hint.stories.tsx` — any story
  copy or caption that describes a downward cue
- `src/app/globals.css` — the `arrow-drop` keyframe travels down; an upward counterpart
  replaces it, along with the comment explaining why it was a mirrored `bounce`
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — one JSDoc
  line describing what the hint says
- `e2e/lesson-video-player.spec.ts` — reads the copy from the message files, so it
  follows without an edit
- No new dependency.

## Non-goals

- **Renaming the component, its folder, or its translation namespace.**
  `ScrollDownHint` still describes the mechanism correctly — the page does scroll down —
  and a rename would churn the player, the e2e spec and three message files for no
  behavior. What changes is which of the two directions the *learner* is told about.
- Changing when the hint appears or disappears, how it is dismissed, or that it must not
  intercept the gesture.
- Moving the hint, restyling the pill, or auto-dismissing it on a timer.
- Changing which gesture actually reclaims the screen, or how the page scrolls.
- Revisiting the bounded travel's length (6.5 iterations) or the 60% displacement — the
  travel flips direction and keeps its shape.
