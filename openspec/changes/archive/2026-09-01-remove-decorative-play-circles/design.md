## Context

`PlayButton` renders a gold circle bearing a play glyph. In `decorative` mode — its
default — it is a `<span aria-hidden="true">` with no handler and no focus behaviour. It
exists so a card can *show* "this is a video" without nesting a button inside a link.

Two callers use it outside that intent. `ContinueWatching` places a `size="lg"` circle to
the left of the panel's copy, and `ModuleShowcaseCard` places one immediately to the right
of its `View videos` button. In both, the circle sits on the card's own background rather
than over artwork, at the largest of the three sizes, in the same gold as the real call to
action — so it reads as the primary control while doing nothing. Its two remaining callers,
`PosterCard` and the module overview's lesson rows, keep it: there it overlays lesson
artwork inside a link that *is* clickable, which is the case the component was built for.

The panels are presentational client/server components with no domain involvement. Both
have colocated component tests with a key-echoing `next-intl` mock; neither has a
Playwright spec that asserts the circle.

## Goals / Non-Goals

**Goals:**

- Remove the decorative circle from both panels so each offers exactly one action.
- Leave the surviving action visually where it is: `Resume` full-bleed then hugging, and
  `View videos` hugging at every width.
- Lock the removal behind a test in each panel, so a future edit cannot quietly restore it.

**Non-Goals:**

- Changing `PlayButton`, its `decorative` prop, or its remaining callers.
- Reworking either panel's glow, spacing scale, breakpoints or copy beyond what dropping
  the circle requires.
- Making the circle interactive rather than removing it.

## Decisions

**Assert absence by mocking `PlayButton`, not by querying its classes.**
The decorative branch renders an unlabelled `aria-hidden` `<span>` with no `data-testid`,
so it is invisible to every accessible query RTL offers. The three ways to assert its
absence are: query its Tailwind classes (couples the test to styling and would pass for the
wrong reason after a restyle), add a `data-testid` to `PlayButton` (touches a component this
change declares out of scope, for four callers, to serve two), or `vi.mock` the module in
the two panel tests and assert the stand-in never renders. The mock is chosen: it proves the
exact fact the requirement states — this panel does not render that component — and it
touches no production code. *Alternative rejected:* asserting `container.querySelectorAll("svg")`
has a given length, which breaks the moment any other icon enters the panel.

**Collapse `ContinueWatching`'s wrapper rather than leaving an empty column.**
The circle was the panel's first flex child, and `sm:flex-row sm:items-center sm:gap-10` on
the wrapper existed to place the copy beside it. With one child left, the row direction, the
cross-axis centring and the horizontal gap all describe a layout that no longer exists, and
the inner `flex-1` column is a wrapper around the whole content. The two divs collapse into
one column. *Alternative rejected:* deleting only the `<span>` — it leaves dead responsive
classes that read as intent and mislead the next reader.

**Keep `View videos` hugging with `sm:self-start`, not with a leftover flex row.**
Its wrapper (`flex items-center gap-4`) existed to pair the button with the circle; it was
also what stopped the button stretching, since a flex column stretches its children by
default. Dropping the wrapper without compensation would silently widen the button to the
panel's 30% column. `sm:self-start` restores the hug at the same breakpoint the existing
`sm:w-auto` already switches on. *Alternative rejected:* keeping a one-child flex row, which
preserves the behaviour but leaves a wrapper whose reason for existing is gone.

## Risks / Trade-offs

- *A styling regression the tests cannot see: the CTA stretches to full width on desktop.*
  → The button's width is a visual property no RTL assertion covers honestly. Verified in
  the running app at desktop and mobile widths with Playwright before the change is called
  done, per the project's visual-review practice.
- *`vi.mock` of `PlayButton` in a panel test could mask a real regression elsewhere.* → The
  mock is module-scoped to those two test files; `play-button.test.tsx` and the other two
  callers' tests continue to exercise the real component.
- *The circle may have been deliberate art direction rather than an oversight.* → The user
  asked for its removal directly, showing both panels. Restoring it is a one-line revert in
  each file, and the specs record why it went.

## Testing strategy

| Layer | What it covers | Mirrors |
| --- | --- | --- |
| Vitest component + RTL — `src/components/continue-watching/continue-watching.test.tsx` | The resolved panel renders no `PlayButton`, while the `continue-watching-resume` action, breadcrumb, title and progress bar still render. Adds a `vi.mock` of `@/components/play-button/play-button` returning a `data-testid` stand-in. | The file's existing `vi.mock("next-intl")` + `makeLocations`/`makePositions` fakes and `waitFor` on the async resolve |
| Vitest component + RTL — `src/components/module-showcase-card/module-showcase-card.test.tsx` | The card renders no `PlayButton`, while `module-showcase-cta`, the ordinal, the count line and the deck still render. Same mock shape. | The file's existing key-echoing `useTranslations` mock and `Course`/`Module`/`ModuleSummary` fixtures |
| Playwright e2e | Nothing new. The existing `course-catalog.spec.ts` and home specs assert the actions that remain; an e2e asserting the absence of an `aria-hidden` decoration would test styling, which is the component layer's job. | — |
| Manual visual check | The CTA keeps its hug width on desktop and its full width on mobile; the `Continue watching` panel reads correctly as one column. Driven with Playwright MCP against the dev server. | — |

Red → Green → Refactor per task: the absence assertions are written and seen to fail
against the current components before either component is edited.
