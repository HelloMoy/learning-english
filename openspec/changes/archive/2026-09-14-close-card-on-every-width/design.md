## Context

`LessonView` composes the center column's `LessonCloseCard` (wrapping
`LessonCompletionToggle`) and the right rail's `UpNextCard`. Both know about the `lg`
breakpoint through Tailwind variants: the card resets its surface and hides its prompt,
divider and next-lesson row (`lg:rounded-none lg:border-0 lg:bg-transparent`,
`lg:hidden`), the toggle hides its prompt and shrinks its button (`lg:hidden`,
`lg:w-auto`, `lg:items-start`), and the rail card is `hidden lg:block`. The three specs
(`lesson-close-card`, `lesson-page`, `cinema-lesson-view`) encode one invariant: the
next lesson is offered exactly once at any width.

The learner wants the phone's closing card on desktop too. Keeping the invariant means
the rail card has to go.

## Goals / Non-Goals

**Goals:**

- One closing surface, identical at every width: prompt, full-width button, divider,
  next-lesson row.
- One completion control and one next-lesson link on the page, at every width.
- Nothing left behind: no `lg:` conditionals that no longer mean anything, no unused
  component.

**Non-Goals:**

- Redesigning the card, the button, or the rail.
- Touching completion behaviour, the outline, the Resources placement rule.

## Decisions

**D1 — Remove the rail's "Up next" card rather than keep both.** The alternative —
leaving the rail card and relaxing the "offered once" invariant — puts the same link
twice on a 1280px screen, one of them a text line the closing row already replaced on
phone for being a poor target. The invariant was a deliberate decision in
`lesson-close-complete-and-continue`; the card moving to desktop is the reason to honour
it, not to drop it. `UpNextCard` then has no caller, so it is deleted along with its
story, test, barrel export and `Components.UpNextCard` messages; a future rail widget
starts from the closing row's design, not from this one.

**D2 — Delete the breakpoint variants; add no props.** The card and the toggle become
unconditional: the `lg:` classes are removed rather than replaced by a `variant` prop or
a "show chrome" flag. There is one presentation now, so a switch would be a switch with
one position. The unknown-state skeleton drops its `lg:` variants too, so it keeps
matching the real control's height at every width.

**D3 — The closing row stays the page's only next-lesson landmark.** The card's section
keeps its `data-testid` and the row keeps being a single link named after the lesson;
the e2e cross-module tests that used the rail's `region[name="Up next"]` are re-pointed
at the card. No `aria-label` is added to the card: its eyebrow is the visible label and
the link's accessible name already carries the destination.

**D4 — The card lives in the rail, under Resources, and Resources is rendered once.**
On desktop the learner wants the closing card in the right column, below the materials.
Moving the card into the `<aside>` after `ResourceList` gives that for free on the
phone too: below `lg` the rail stacks after the center column, so the order is content,
materials, closing card — the very order the old phone-only copy of `ResourceList`
inside the center column existed to produce. That copy and its `lg:hidden` /
`hidden lg:block` pair are therefore deleted rather than kept; one `ResourceList`, one
`LessonCloseCard`, no breakpoint switches in the composition. The alternative — leaving
the card in the center column and repositioning it with grid placement at `lg` — would
keep the duplicate materials and add a layout rule nobody can read off the tree.

## Risks / Trade-offs

- [The desktop rail becomes shorter than the center column] → It already was on
  lessons with no resources; the rail's `space-y-4` and the grid's `gap-8` need no
  change. Verified in the browser at 1440px.
- [A story or e2e still asserts the rail card] → Every reference is listed in tasks; the
  `UpNextCard` deletion makes any survivor a type or lint error, not a silent one.
- [Translators keep `Components.UpNextCard` in their own copies] → The key is removed in
  all three locale files in the same change; nothing reads it afterwards.

## Testing strategy

- **Vitest component + RTL** (mirrors `lesson-completion-toggle.test.tsx`,
  `lesson-close-card.test.tsx`, `lesson-view.test.tsx`):
  - The toggle's prompt and button carry no `lg:` variant; the button is `w-full` and
    its container `items-stretch` with nothing overriding them; the skeleton likewise.
  - The card's section keeps `rounded-xl border bg-card` with no `lg:` reset, and the
    next-lesson row's wrapper carries no `lg:hidden`.
  - `LessonView` renders the materials once, inside the rail `<aside>`, directly ahead
    of the closing card; exactly one link to the next lesson outside the outline; the
    completion button mounted once; nothing of either in `main`.
- **Playwright e2e** (`e2e/lesson-page.spec.ts`, mirrors the existing
  `lesson-close-card` block): at 1440px the closing card's next-lesson link is visible,
  the page has no "Up next" region, the card shares the rail's left edge with the
  single Resources card and sits below it and to the right of the player, and "Mark as
  complete" inside the card still completes the lesson. At 390px the materials still
  precede the card. The cross-module navigation tests use the closing card at their
  default width.
- **No unit layer**: nothing pure changes.
