# Proposal: account-trigger-wears-header-chip

## Why

The phone account trigger added by `compact-header-account-control` renders as a bare round glyph, while the two controls beside it — the install chip and the locale chip — are bordered rounded-square chips on a faint fill. Three controls sit in the same row at the same size and only one of them looks like a control, so the newest one reads as an afterthought rather than part of the set.

## What Changes

- The account trigger wears the same chip treatment as the install control: `rounded-md`, a `border-border` outline, the `bg-foreground/5` fill, muted foreground, and the same hover and focus transitions.
- Its glyph renders at the install chip's icon size, so the two read as siblings rather than as two different kinds of thing.
- Its footprint does not change: `min-h-11 min-w-11` with `px-3` around a 16px glyph is the same 44×44 the bare trigger occupied, so every width measured in `compact-header-account-control` still holds.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-home`: the global-header requirement states that the account trigger is presented as a chip like the header's other controls, rather than leaving its appearance unsaid.

## Non-goals

- **No change to what the trigger does** — same menu, same items, same accessible name, same breakpoint.
- **No change to the install chip or the locale chip.**
- **No shared chip primitive.** Three controls now spell out a near-identical class list, which is the point at which extraction usually earns its keep — but the three differ in glyph colour, font and inner spacing, and two of them own tests and stories. Recorded in `design.md` as the next refactor rather than bundled into a styling fix.

## Impact

- `src/components/site-header/site-header.tsx` — the `AccountMenu` trigger's class list and glyph size.
- `src/components/site-header/site-header.test.tsx` — an assertion that the trigger is presented as a chip.
- `openspec/specs/cinema-home/spec.md` — via the delta spec.
