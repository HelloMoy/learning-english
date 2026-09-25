# Design: compact-header-account-control

## Context

`SiteHeader` lays out one flex row: the wordmark on the left, and a `shrink-0` control group on the right holding the install chip (iPhone Safari only), the locale chip, and the account control. The wordmark's wrapper carries `min-w-0 shrink overflow-hidden`, so when the row runs out of width the wordmark is what clips — it has no spaces and cannot wrap. That is the observed failure, not an overflow: the document never scrolls sideways, the identity just silently loses its second half.

All widths below were measured in Chromium at the live page's own font stack, with the label strings from `src/messages/*.json`.

| Item                                    | Width  |
| --------------------------------------- | ------ |
| Wordmark, 13px / 0.18em                  | 152.6  |
| Install chip (`min-w-11`)                | 44     |
| Locale chip (`ES ⌄`)                     | 61.4   |
| `Iniciar sesión`, 14px semibold, `px-3`  | 112.5  |
| `Sign in`, same                          | 69.8   |
| `Entrar`, same                           | 65.6   |
| Icon trigger (`size-11`)                 | 44     |

## Goals / Non-Goals

**Goals:**

- The wordmark renders whole for a signed-out visitor on every iPhone that can show the install chip.
- The account action stays reachable, and stays spelled out where it is read.
- The desktop header is byte-for-byte the header it is today.

**Non-Goals:**

- Changing the wordmark's size, any label's wording, the locale chip, the install chip, or the sign-in page.
- Covering 320px with the install chip (see Risks).

## Decisions

**D1 — The account control sheds its text into a menu, not into a smaller font.** Shrinking the label was measured first: 12px with no padding still leaves Spanish at 76px, and even paired with a `min-w-11` floor it only reaches the budget by a few pixels. The header already owns a better answer — with a learner card it renders a 44px avatar that opens a menu — so the signed-out control takes the same shape below `sm`: a `CircleUser` trigger opening a menu whose item is the account action, written out in full. 112.5px → 44px, the largest saving available, and the phrase a visitor reads is unchanged.

**D2 — Both text branches get it, not just Sign in.** The same row also renders a **Sign out** button for a session whose device has no learner card, and `Cerrar sesión` is 70px at 12px — the identical bug in a rarer state. Both branches render the same trigger below `sm`, differing only in the menu item, so the header has one phone-shaped account control in every session state.

**D3 — The trigger gets its own accessible name.** A button labelled `Iniciar sesión` that opens a menu instead of signing in misdescribes itself. `SiteHeader.accountMenuLabel` names it as the account menu, matching how `learnerMenuLabel` names the avatar. The full action keeps its own name on the menu item, where it is also the visible text, so WCAG 2.5.3 (Label in Name) holds without any split-label machinery.

**D4 — Both shapes render, one hidden by breakpoint.** The desktop link and the phone trigger both mount, with `hidden sm:inline-flex` and `sm:hidden` deciding which is seen — the pattern the header already uses. A JS-measured swap would need a resize observer and would flip after hydration.

**D5 — Gaps tighten below `sm`.** The row's `gap-4` and the group's `gap-2.5` are minimums under `justify-between`: they only bind when space is scarce, which is exactly the crunch. `gap-1` / `gap-2` below `sm` buy 16px and change nothing at any width where the header already fits. Without them the reported device fits by 5px; with them, by 21px, and a 360px iPhone fits at all.

**D6 — 320px without the install chip is the e2e proxy for 375px with it.** The install chip costs 54px (44 + gap) and renders only on iPhone Safari, which no Playwright project emulates. `375 − 54 = 321`, so a 320px viewport without the chip is a marginally *stricter* budget than the reported device: 18px of slack versus 21px. The e2e guards the reproducible width and the comment says why it stands in for the other.

**D7 — The old clipping assertion was a false negative and is replaced.** `e2e/mobile-viewport.spec.ts` asserted `wordmark.scrollWidth <= wordmark.clientWidth`. The link is a flex item with the default `min-width: auto`, so it never shrinks below its content and those two numbers are always equal; the wrapper is what clips. The check now asks the clipping ancestor whether it is wide enough to show the whole mark, which is what "not clipped" means. Verified by running it against the unfixed build: the new assertion fails in all three locales where the old one passed.

**Measured outcome** (signed out, Spanish, worst case):

| Case                              | Needs   | Has | Before        |
| --------------------------------- | ------- | --- | ------------- |
| 375px + install chip (iPhone SE)  | 322     | 343 | 406.5 ✗       |
| 360px + install chip (12 mini)    | 322     | 328 | 406.5 ✗       |
| 320px, no install chip            | 270     | 288 | 352.5 ✗       |
| 320px + install chip              | 322     | 288 | ✗ — see Risks |

## Risks / Trade-offs

- [An icon is less obvious than the word `Iniciar sesión`, so a visitor on a phone needs one tap to see the action] → The trade the user chose, and the header already teaches the pattern: the same corner holds the same round trigger once they are signed in. The glyph is `CircleUser`, the conventional account mark.
- [A 320px viewport *with* the install chip — an iPhone SE running iOS Display Zoom — still needs 322px of 288px] → Not fixed here. Every remaining lever means dropping a control or the wordmark's size, and the install chip belongs to the `add-to-home-screen-guide` capability. Recorded so the next change to that capability can pick it up rather than rediscovering it.
- [Two account controls in the DOM, one hidden] → Both are queryable in tests, so a test that forgets the breakpoint can assert against the wrong one. The component tests name the breakpoint class each time, as the file already does elsewhere.

## Migration Plan

Single PR. No data or config migration. Rollback is reverting the commit.

## Testing strategy

| Behavior                                                                          | Layer                  | File / pattern                                                                                                     |
| --------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Wordmark renders whole for a signed-out visitor at a phone width, in every locale  | Playwright e2e         | `e2e/mobile-viewport.spec.ts` — new signed-out block, using the corrected `wordmarkIsWhole` helper                     |
| The corrected clipping check actually fails on a clipped wordmark                  | Playwright e2e         | same helper, run against the unfixed build before implementing (D7)                                                   |
| The phone trigger opens a menu offering the account action                         | Vitest component + RTL | `src/components/site-header/site-header.test.tsx` — mirrors the existing `LearnerMenu` menu tests                     |
| Both session-without-card and signed-out get the trigger                           | Vitest component + RTL | same file, driven from the existing `signedIn` / learner-status fixtures                                              |
| The desktop link survives unchanged and is the one hidden below `sm`               | Vitest component + RTL | same file — class assertions in the style the file already uses for `sm:` behavior                                    |
| Message files stay in parity across locales after the new key                      | Vitest unit            | `src/messages/messages.test.ts` — already exists, must stay green                                                     |

TDD order per task: the e2e clipping guard goes red first (it reproduces today's bug), then the component tests, then the implementation that turns both green.

## Open Questions

_None — the wordmark-versus-label trade-off was put to the user, who chose to keep the wordmark at full size and move the account action behind an icon on phones._
