# Proposal: compact-header-account-control

## Why

On an iPhone SE (375px CSS) a signed-out visitor reading Spanish sees the wordmark clipped to `ENGLISH·C`. The header needs 406px and has 343px. The `cinema-home` spec already forbids this — "The wordmark is never dropped; it is the header's identity" — so the header is violating its own shedding order.

The cause is the account control. `Iniciar sesión` at 14px semibold measures 112px, making it the widest thing in the header after the wordmark itself and the only control still rendering at 14px while every other chip is 12px. It is worst in Spanish (English `Sign in` is 70px, Portuguese `Entrar` 66px), and it competes with the add-to-home-screen chip, which appears **only on iPhone Safari** — exactly the case that overflows, and exactly the case no desktop Playwright project can reproduce.

The header already solves this problem once: with a learner card it shows a 44px avatar that opens a menu instead of spelling anything out. The signed-out header can borrow that shape.

## What Changes

- Below `sm`, the account control becomes a 44×44 icon trigger — lucide `CircleUser`, the signed-out counterpart to the learner's avatar — that opens the same kind of menu the avatar opens. The menu holds the account action written out in full: **Sign in** without a session, **Sign out** for a session whose device has no learner card.
- From `sm` up, nothing changes: the **Sign in** link renders exactly as it does today, with its full label at its current size.
- The header row's gaps tighten below `sm` (outer `gap-4` → `gap-1`, control group `gap-2.5` → `gap-2`) so the crunch case has room. At widths where the header already fits, `justify-between` spreads the groups and nothing moves.
- A new `SiteHeader.accountMenuLabel` key names the trigger for assistive technology in all three locales, because a button that opens a menu should not claim to be the action inside it.
- The wordmark keeps its current phone size (13px / 0.18em). It is the thing being rescued, so it does not pay for the fix.
- **Bug found while writing the guard:** the existing e2e check for a clipped wordmark compares the link's own `scrollWidth` to its `clientWidth`, but the `overflow-hidden` lives on the link's wrapper, so the link always reports itself whole. That assertion could never fail. It is replaced by one that measures the clipping ancestor.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-home`: the global-header requirement gains the account control in its shedding order — below `sm` it sheds its visible text into a menu behind an icon trigger, rather than pushing the wordmark out of view — and gains scenarios for the signed-out phone header and the icon's menu.

## Non-goals

- **No copy changes.** `Iniciar sesión` and `Cerrar sesión` keep their wording: the menu has room for the full phrase, so nothing needs shortening. The sign-in page is likewise untouched.
- **The wordmark's size does not change.** Shrinking it to 11px was the measured alternative and was rejected: a complete-but-smaller mark does not answer "I can't read it" as well as a complete one at full size.
- **The locale switcher and the install chip are untouched** — no padding, size or behavior change.
- **A 320px viewport *with* the install chip stays out of reach** (an iPhone SE with iOS Display Zoom). It needs 322px of 288px even after this change; closing it means dropping a control, which belongs to the `add-to-home-screen-guide` capability. Recorded in `design.md` as a follow-up, not fixed here.

## Impact

- `src/components/site-header/site-header.tsx` — the signed-out and no-card branches of `SessionControl` gain a phone-only menu trigger; the row and control group get tighter phone gaps.
- `src/components/site-header/site-header.test.tsx` — new assertions for the icon trigger, its menu, and the desktop link surviving unchanged.
- `src/messages/{en,es,pt}.json` — one new `SiteHeader.accountMenuLabel` key.
- `e2e/mobile-viewport.spec.ts` — a corrected clipping check and a signed-out counterpart to the existing learner-card block.
- `openspec/specs/cinema-home/spec.md` — via the delta spec.
