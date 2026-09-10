## Why

The hint over the enlarged video spells the gesture out in words — *"Desliza hacia arriba
para ocultar la barra del navegador y ver el video completo"* — and learners act on the
wrong direction: on a phone held in landscape, "arriba" is ambiguous enough that some
swipe down. The sentence also wraps to two lines across the top of a video the learner
enlarged precisely to see more of, and it explains a browser implementation detail
(hiding the toolbar) that the learner never asked about.

Every coach mark the platforms ship for this exact gesture — YouTube's "swipe up" cue,
Instagram's and TikTok's, iOS's own "swipe up to open" — carries the direction in a
**moving arrow**, not in a word, and keeps the copy to a three-or-four-word promise of
the outcome. Direction is a spatial fact; motion states it in any language and no
learner can read it backwards.

## What Changes

- The hint's visible copy shrinks to a short outcome-first line with **no direction
  word**: `Scroll for full screen` / `Baja para pantalla completa` /
  `Role para tela cheia`. The browser-toolbar explanation is dropped.
- The cue is framed as **the scroll, not the finger**. What reclaims the screen is the
  page scrolling down; that is the motion the learner is asked for, the arrow points down
  along it, and the verb is a scroll verb so that arrow and words say the same thing. A
  swipe verb beside a downward arrow would tell the finger to travel down — two cues
  disagreeing, which is the failure this change exists to remove.
- The component is renamed `SwipeUpHint` → `ScrollDownHint`, with its folder, its
  translation namespace and its spec wording, so the name states what the hint asks for.
- Direction moves from the sentence into an **animated arrow** pointing down. The hint
  slides in downward, the arrow then repeats a short downward travel for a **bounded
  stretch — about four and a half seconds — and holds still after that**, pointing. A
  coach mark that never stops moving over a video the learner just enlarged works against
  the very thing they asked for.
- All of that motion stops under `prefers-reduced-motion`, leaving the arrow still and
  pointing.
- Because motion carries nothing to a screen reader, the hint gains a **visually hidden
  directional sentence** so assistive technology still hears which way to swipe.
- The hint stays on one line at phone widths — it never wraps.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: the requirement covering the swipe hint changes what the hint must
  convey and how. Today it requires a hint "telling the learner to swipe up"; it will
  require that the direction be carried by an animated arrow rather than by a direction
  word in the visible copy, that the visible copy stay short and outcome-first, that the
  motion respect `prefers-reduced-motion`, and that the direction still reach assistive
  technology in words.

## Impact

- `src/components/lesson-view/swipe-up-hint/**` → `src/components/lesson-view/scroll-down-hint/**`
  — renamed folder and files; arrow, animation, screen-reader sentence, single-line layout
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — the import
  and the element it renders
- `src/messages/{en,es,pt}.json` — the namespace becomes `Components.ScrollDownHint`, its
  `message` is rewritten, and a screen-reader key is added
- `e2e/lesson-video-player.spec.ts` — reads its copy from the message files, so it follows
  the namespace rename and needs nothing else
- No new dependency: the animation uses Tailwind's built-in utilities, so
  `src/app/globals.css` is not touched

## Non-goals

- Moving the hint away from the top edge of the player, or restyling the pill's colour,
  border, or blur beyond what a one-line layout requires.
- Changing when the hint appears or disappears, or how it is dismissed — those
  requirements stand untouched.
- Auto-dismissing the hint on a timer.
- Changing which gesture actually reclaims the screen, or how the page scrolls.
- Touching the add-to-home-screen guide's work in progress in `src/app/globals.css`.
