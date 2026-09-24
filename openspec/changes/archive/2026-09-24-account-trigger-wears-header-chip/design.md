# Design: account-trigger-wears-header-chip

## Context

The header's right-hand group holds up to three controls at phone widths: `InstallAppButton`, `LocaleSwitcher`, and the `AccountMenu` trigger. The first two already share a chip look — `rounded-md border border-border bg-foreground/5 px-3`, `min-h-11 min-w-11`, `transition-colors hover:bg-foreground/10` — that the third does not, because it was written to echo the learner avatar's round trigger instead.

The avatar is the wrong sibling to copy. The avatar is a *portrait*: round because it holds a face or initials, and it replaces the account control rather than sitting beside the other chips. The signed-out trigger holds a glyph, in a row of glyph chips.

## Goals / Non-Goals

**Goals:**

- The account trigger is visually one of the header's chips.
- Its width stays exactly 44px, so the fit work in `compact-header-account-control` is untouched.

**Non-Goals:**

- Changing behavior, the menu, the accessible name, or the breakpoint.
- Restyling the install or locale chips.
- Extracting a shared chip primitive (see below).

## Decisions

**D1 — Copy the install chip, not the locale chip.** Both are chips, but the locale chip carries text (`text-xs font-semibold`, `gap-1.5` between label and chevron) while the install chip is a centred glyph — which is exactly what the account trigger is. Matching the install chip means matching `justify-center`, `text-muted-foreground` and `hover:text-foreground`, and nothing has to be invented.

**D2 — The glyph renders at `size-4`, like `SquarePlus`.** Two icon chips side by side at different glyph sizes read as a mistake. `CircleUser` at 16px inside a 44px chip matches its neighbour's proportions.

**D3 — Width is unchanged, and that is load-bearing.** The bare trigger was `size-11` — 44px flat. The chip is `min-h-11 min-w-11 px-3` around a 16px glyph: `12 + 16 + 12 = 40`, floored by `min-w-11` to 44. Identical, so the measured budgets (iPhone SE at 375px needs 322 of 343) carry over untouched and need no re-measuring beyond a confirming screenshot.

**D4 — No shared chip primitive yet.** Three near-identical class lists is normally the signal to extract one. Against it: the three differ in glyph colour, font, inner spacing and disabled handling, so the shared part is a shell rather than a component; and `InstallAppButton` and `LocaleSwitcher` each own tests and stories that a refactor would have to carry. A styling fix is the wrong change to hide that in. If a fourth chip appears, extract then — a `header-chip` module under `src/components/`, per the folder-per-entity rule, with the three existing chips migrated in one deliberate change.

## Risks / Trade-offs

- [The class list is now duplicated a third time, and a future edit to the chip look has to be made in three files] → Accepted deliberately and recorded in D4 with the trigger for undoing it.
- [A class-level assertion in the component test couples to Tailwind utilities] → Consistent with how this file already guards presentation, and jsdom has no rendering to assert against instead. The real check is the screenshot in the verification task.

## Migration Plan

Single change, styling only. Rollback is reverting the commit.

## Testing strategy

| Behavior                                                           | Layer                  | File / pattern                                                                          |
| ------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| The account trigger is presented as a chip, like its neighbours      | Vitest component + RTL | `src/components/site-header/site-header.test.tsx` — class assertion beside the existing trigger tests |
| The trigger still opens its menu and keeps its name and breakpoint   | Vitest component + RTL | same file — the tests from `compact-header-account-control`, which must stay green unchanged |
| It looks like the install chip, at both phone widths                 | Manual, Playwright MCP | a screenshot of the header with all three chips, in an iPhone Safari context                |

TDD: the class assertion goes red against the round trigger first, then the class list changes.

## Open Questions

_None._
