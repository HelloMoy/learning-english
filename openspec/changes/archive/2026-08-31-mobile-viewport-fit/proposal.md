## Why

The app does not fit on a phone. On every route, in every locale, the document is
wider than the viewport: `document.scrollWidth` measures **496px inside a 390px
viewport**, and **484px inside a 320px viewport** on `/es`. A learner on a phone gets a
page that slides sideways under their thumb, a theme toggle parked entirely off-screen
where it cannot be tapped, and a `CinemaBackground` that stops at the viewport edge and
leaves a black band down the right of every screen.

This is not a polish item. Phones are the device this content is consumed on — short
pronunciation videos with bilingual notes — and the first interaction on every route is
a horizontal scroll the learner did not ask for.

## What Changes

- **The global header adapts to narrow viewports instead of overflowing them.** Today
  the wordmark (203px, indivisible — `LEARN·ENGLISH` contains no spaces) and the
  locale-switcher + theme-toggle group (261px) sit in a row that permits neither
  shrinking nor wrapping, giving the header a ~512px intrinsic minimum. Below roughly
  490px of viewport it pushes the whole document sideways. The header will fit its
  controls within the viewport at 320px and up, in all three locales, and every control
  in it stays reachable.
- **No route produces horizontal scroll on a phone.** This becomes a stated, tested
  guarantee across the six routes rather than a property each view happens to have.
  `CinemaBackground` covers the full document width as a consequence.
- **Lesson titles in the module video list wrap instead of truncating on narrow
  viewports.** At 320–390px the current `truncate` collapses every row of module 10 to
  the same useless prefix — `Exercise 1 Pronunciati…`, `Exercise 2 Pronunciati…` — so
  the list cannot be used to pick a lesson. Titles wrap on phones; the single-line
  truncation stays on wider rows where it reads correctly.
- **The language control becomes a compact button backed by a menu.** The native
  `<select>` renders the text of its selected `<option>`, so it is always as wide as
  `Portuguese`/`Portugués` — 106px even with its `Language:` prefix removed, which does
  not fit the width budget at 320px. Replacing it with a button that shows the active
  locale (`ES` on a phone, `Español` from `sm` up) and opens a menu of the three
  languages decouples the control's width from the length of the label it displays.
- **The header's controls become thumb-sized.** The theme toggle (72×30) and the
  language `<select>` (87×18) clear the WCAG 2.2 AA floor of 24×24 but sit well under
  the 44×44 a thumb needs. They grow on touch-sized viewports.

## Capabilities

### New Capabilities

- `responsive-viewport-fit`: the cross-cutting rule that every route renders within the
  viewport width on phone-class viewports in every supported locale — no horizontal
  document scroll, no control pushed out of reach, background chrome covering the full
  document. It sits above the per-view cinema capabilities because no one of them owns
  the failure: the overflow originates in the shared layout chrome and manifests on all
  six routes.
- `ui-menu-primitive`: a shadcn/ui `DropdownMenu` primitive at
  `src/components/ui/dropdown-menu/`, built on the `radix-ui` unified package already
  used by `button.tsx` and `dialog.tsx` — no new dependency. It exists because the
  locale control needs a menu and this project keeps its primitives shared and specified
  rather than inlined into one consumer, exactly as `ui-dialog-primitive` does. Scoped
  to what a single-choice menu needs (root, trigger, portalled content, radio group,
  radio item); sub-menus, checkbox items, and shortcut slots are deliberately excluded
  until something asks for them.

### Modified Capabilities

- `cinema-home`: the "Global header shows brand and section chrome" requirement fixes
  the header's contents but says nothing about what happens when they do not fit. It
  gains the narrow-viewport adaptation — what the header keeps, what it drops, and the
  guarantee that locale switching and theme toggling stay operable on a phone.
- `cinema-module-overview`: the video-row requirement mandates the lesson title in each
  row but not that it stays *legible*. It gains the requirement that a title too long
  for one line stays readable on narrow viewports rather than being cut to a prefix
  shared with its neighbours.

## Impact

**Code**

- `src/components/site-header/site-header.tsx` — the row gains narrow-viewport
  behavior; the primary source of the overflow.
- `src/components/ui/dropdown-menu/dropdown-menu.tsx` — new shared primitive, mirroring
  the structure and JSDoc conventions of `src/components/ui/dialog/dialog.tsx`.
- `src/components/locale-switcher/locale-switcher.tsx` — the native `<select>` becomes a
  menu-backed button showing the active locale. **BREAKING** for anything asserting on
  its `combobox` role: the control's role changes to `button` plus a `menu` of
  `menuitemradio` items. The existing component test moves with it.
- `src/components/theme-toggle/theme-toggle.tsx` — gains a touch-sized hit area and
  sheds the theme-name text that makes it unshrinkable on a phone.
- `src/components/module-overview/module-overview.tsx` — the lesson title's `truncate`
  becomes viewport-conditional.
- Storybook stories for the touched components gain narrow-viewport variants.
- `e2e/` — a spec that walks the six routes at phone widths in each locale and asserts
  `document.scrollWidth` never exceeds the viewport; this is the regression guard that
  makes the new capability real.

**Not affected**

- No domain, use-case, port, or adapter code. Presentation layer only.
- No route, data shape, or message-key changes beyond what dropping a visible label
  requires (the accessible name must survive as `aria-label`).
- The lesson page's own layout (player, Notes/Transcript tabs, ES/EN split, resources,
  up-next), the outline drawer, the resume modal, and the 404 page — all verified to
  fit already.

## Non-goals

- Redesigning the header. This change makes the existing header fit; it does not
  introduce a hamburger menu, a bottom nav, or any new *navigation* surface. Replacing
  the locale `<select>` with a menu-backed button is in scope — it is the same control
  with the same three destinations, re-housed so its width stops being dictated by the
  longest language name. Nothing new becomes reachable from the header.
- A general menu system. `ui-menu-primitive` covers single-choice menus only; the
  primitive stops at what the locale control needs.
- A mobile-first restyle of the four views. Beyond the module-list title, the views
  themselves were measured and fit; their type scale, spacing, and hierarchy are
  untouched.
- Raising every touch target in the app to 44×44. The breadcrumb links (18px) and the
  outline rows (36px) are noted but left alone — they meet WCAG 2.2 AA, and enlarging
  the outline rows would change the drawer's scroll geometry, which
  `outline-current-lesson-visibility` just settled. Only the header controls, which
  overflow anyway and must be rebuilt, are resized here.
- Tablet and desktop layout. Measurement puts the overflow threshold below ~490px;
  560px, 640px, 768px, 844px landscape, and up were all clean and stay as they are.
- Container queries or a new breakpoint system. The existing Tailwind breakpoints are
  sufficient for a fix at this scale.
