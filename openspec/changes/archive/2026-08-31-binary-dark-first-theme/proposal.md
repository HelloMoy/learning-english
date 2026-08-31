## Why

The theme control is a three-state cycle — `light → dark → system` — and the app opens
in whatever the operating system prefers. Both decisions cost more than they return.

A three-state cycle makes a learner press the button up to three times to reach the
theme they want, and one of the three states does not name a theme at all: "System"
tells them where the answer comes from, not what they are about to see. On a phone,
where the button is now icon-only, that third state is invisible until pressed.

And the app has a preferred look. Immersion Cinema is a dark design — near-black `#08080b`
with gold accents, built to sit behind video. Deferring to the OS means a learner whose
laptop is in light mode meets the palette the design treats as the alternate, on first
load, without ever choosing it.

## What Changes

- **The theme toggle becomes binary.** One press moves between dark and light; there is
  no third stop. **BREAKING** for anything that expects the `system` state.
- **Dark becomes the default.** A first-time visitor with no stored preference gets the
  dark palette regardless of their OS setting. The app stops following
  `prefers-color-scheme`.
- **`system` stops being a theme the app can be in.** The `ThemeProvider` is pinned to
  the two real themes, and the `ThemeToggle.system` message key is removed from all
  three locales.
- **A learner already carrying `"system"` in storage is migrated on their next visit.**
  That value was written by the current build and will still be in `localStorage`; it
  resolves to dark — the new default — rather than leaving the toggle in a state that
  is in neither list.

## Capabilities

### Modified Capabilities

- `cinema-theme-tokens`: the token layer requirement defines a light variant on `:root`
  and a dark variant on `.dark`, and the shared-primitives requirement covers the
  controls that compose them. Neither says which variant a visitor gets first, nor how
  many states the control cycles through. Both gain that: dark is the default, the
  control is binary, and `system` is not a state the app can hold.

## Impact

**Code**

- `src/components/theme-toggle/theme-toggle.tsx` — the `Theme` union and `THEMES` array
  lose `system`; the modulo cycle becomes a two-way swap; a stored `system` is
  normalised to dark.
- `src/app/[locale]/layout.tsx` — `<ThemeProvider defaultTheme="system" enableSystem>`
  becomes dark-defaulted with system following disabled and the theme list pinned.
- `src/messages/{en,es,pt}.json` — the `ThemeToggle.system` key is removed from all
  three. `src/messages/messages.test.ts` compares key sets across locales, so removing
  it from one and not the others fails that test — which is the point.
- `src/components/theme-toggle/theme-toggle.stories.tsx` — the `InSystemMode` story
  goes; a story covering the migration of a stored `system` replaces it.
- `src/components/theme-toggle/theme-toggle.test.tsx` — the three-state cycle tests
  become two-state, plus a case for the migration.

**Not affected**

- The palette itself. Both variants keep their current token values; this changes which
  one a visitor starts in, not what either looks like.
- The toggle's geometry and accessibility contract from `mobile-viewport-fit`: the
  44×44 hit area, the theme name hidden below `sm`, the `Theme: <name>` accessible name
  built from `aria-label` rather than the visible text, and the pre-hydration
  placeholder branch all stay exactly as they are.
- No domain, use-case, port, or adapter code.

## Non-goals

- Removing the light theme. It stays a first-class, fully supported variant with its own
  WCAG-checked token values — it simply stops being the one an OS setting can select on
  the learner's behalf.
- Honouring `prefers-color-scheme` as a *first-visit hint* while still defaulting to
  dark afterwards. That is a coherent design, but it is not what was asked for and it
  reintroduces the OS dependency this change exists to drop.
- Persisting the theme anywhere other than `localStorage`, or syncing it across devices.
- Changing the toggle's icon. `◐` continues to represent the control at every state.
- Revisiting `next-themes` itself, including the React 19 `<script>` warning documented
  in the component's JSDoc.
