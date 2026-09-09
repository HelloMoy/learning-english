## Context

`LessonVideoResumeOverlay` is `absolute inset-0 grid place-items-center` inside the
player, with a card that stacks a heading (`text-2xl`), a description, the timestamped
offer (`text-lg`), and two `size="lg"` buttons, at `p-6` with `mt-5` / `mt-6` rhythm.
That is roughly 290px tall.

The player is 16:9 and as wide as the centre column. On a desktop column that is ~360px
tall and the card fits with room to spare. At a 390px viewport the player is **202px**
tall, so `place-items-center` centres a 290px card in a 202px box and ~44px escape at
each end — where `overflow-hidden` on the lesson wrapper (`lesson-view.tsx:103`) clips
them. Reproduced under iPhone emulation: the heading is gone and the description opens
mid-sentence.

## Goals / Non-Goals

**Goals:**

- The card lies inside the player's box from 320px upward.
- The choice — the timestamped resume and the restart — survives at every size.
- No loss for assistive technology when an element stops being painted.
- Desktop unchanged.

**Non-Goals:**

- Any change to when the overlay appears or what its actions do.
- Making it a modal or moving it out of the player's subtree.
- A desktop redesign.

## Decisions

### 1. Drop prose, not choices, and keep it in the accessibility tree

The heading ("Continue where you left off") and the description restate what the
timestamped action already says. They are the elements that go first, hidden with
`sr-only` rather than `hidden`, so the `aria-labelledby` / `aria-describedby` the
capability requires keep resolving to real text. The offer line and the two buttons stay
at every size; only their rhythm tightens.

`sr-only` is the whole point of the decision: `hidden` would break the dialog's
accessible name, which is the sort of regression that only shows up in an audit.

*Alternatives considered.* Scaling the whole card with `transform: scale()` keeps every
element but shrinks the tap targets below the 44px the project already holds itself to
elsewhere (`mobile-viewport.spec.ts`). Letting the card scroll as the primary answer
makes the learner scroll to find out what the choice even is.

### 2. A `max-h-full` + `overflow-y-auto` bound as the backstop

Even compact, the card's height depends on a translated string that a future locale may
make longer. Bounding it to the player's height and letting it scroll within itself means
the worst case is a scrollbar rather than a clipped, unreachable action. It is a
backstop, not the mechanism — the compact form is expected to fit without it.

### 3. Tailwind breakpoint, not a container query

The project's other responsive rules use the `sm:` breakpoint, and the player's height
tracks the viewport width here because the column is fluid and the aspect ratio is fixed.
A container query would be more precise but would be the only one in the codebase.

## Risks / Trade-offs

- **A learner on a phone no longer reads the description.** → It restates the offer,
  which the timestamped button already carries; the same words remain for screen readers.
- **`sr-only` content is easy to delete by accident later.** → The test asserts the
  dialog's accessible name and description at the compact size, so removing it fails.
- **The bound is expressed in Tailwind classes on the card**, which a future refactor of
  the player box could invalidate. → The e2e assertion compares the card's box to the
  player's box, so it fails on any layout change that breaks containment, whatever caused
  it.

## Testing strategy

| Behavior                                                          | Layer                            | Where                                     |
| ----------------------------------------------------------------- | -------------------------------- | ----------------------------------------- |
| Both actions and the timestamp are present in the compact form     | Vitest + RTL                     | `lesson-video-resume-overlay.test.tsx`     |
| The dialog keeps its accessible name and description               | Vitest + RTL                     | same file                                  |
| The card is bounded by the player at 390px and 320px               | Playwright (iPhone emulation)    | `e2e/lesson-playback-resume.spec.ts`       |
| Desktop still paints heading and description                       | Vitest + RTL                     | `lesson-video-resume-overlay.test.tsx`     |

RTL cannot measure the clipping — jsdom does no layout, so every box is 0×0 — which is
why containment is asserted in Playwright, at the viewport where the bug reproduces. RTL
covers what it can actually observe: which elements are rendered, and what the dialog's
accessible name and description resolve to.

Patterns to mirror: the existing `lesson-video-resume-overlay.test.tsx` for the RTL
setup, and `mobile-viewport.spec.ts` for the phone-viewport Playwright pattern. The
overlay's stories gain a phone-sized variant.

Per the project's TDD rule the Playwright containment assertion is written first: it is
red today, and it reproduces the reported bug rather than a proxy for it.
