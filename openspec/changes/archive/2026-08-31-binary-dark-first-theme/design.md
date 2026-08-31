## Context

Two files hold the current behaviour.

`src/app/[locale]/layout.tsx` mounts:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
```

`src/components/theme-toggle/theme-toggle.tsx` holds:

```ts
type Theme = "light" | "dark" | "system";
const THEMES: Theme[] = ["light", "dark", "system"];
// …
const nextTheme = THEMES[(THEMES.indexOf(theme as Theme) + 1) % THEMES.length]!;
```

So the cycle and the provider's theme list are declared in two places that must agree,
and the toggle reaches its next state by modular arithmetic over the list.

Everything else about the component was settled by the `mobile-viewport-fit` change and
is not in play here: the 44×44 hit area, the theme name hidden below `sm`, the
`aria-label` of the form `Theme: <name>` built from the full theme name rather than the
visible text, and the pre-hydration placeholder gated on `useIsHydrated()`.

The messages carry `ThemeToggle.{label,light,dark,system}` in `en`, `es`, and `pt`.
`src/messages/messages.test.ts` asserts the three catalogues share an identical key set.

## Goals / Non-Goals

**Goals:**

- One press moves between exactly two themes.
- No stored preference means dark, regardless of the OS.
- A `system` value left in a learner's storage by the current build resolves to
  something valid and usable rather than wedging the control.
- No user-facing string anywhere still says "system".

**Non-Goals:**

- Anything in the proposal's Non-goals — notably, keeping `prefers-color-scheme` as a
  first-visit hint, and touching either palette's token values.
- Re-litigating the geometry or accessibility contract just established for this button.

## Decisions

### D1. Turn off `enableSystem` and pin `themes`, rather than only changing the default

`defaultTheme="dark"` alone is not enough. With `enableSystem` left on, `next-themes`
keeps `system` in its theme list, keeps a `prefers-color-scheme` media query listener
alive, and keeps resolving `system` to whichever variant the OS wants — so a learner
carrying the old stored value would still be driven by their OS, and the app would still
be able to enter a state the toggle no longer offers.

The provider therefore becomes:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  themes={["dark", "light"]}
  disableTransitionOnChange
>
```

`themes` is passed explicitly rather than relying on the `enableSystem={false}` default.
The library's default list happens to be `["light", "dark"]` today; naming it makes the
app's two themes a stated fact at the one place that configures them, and it is what
`system` is validated against.

Alternative considered: leave the provider alone and filter `system` out in the toggle.
Rejected — the provider is what writes storage and applies the class. Filtering only in
the button would leave the app able to *be* in a state the button cannot express, which
is the exact defect being removed.

### D2. Normalise at read, in one function, rather than trusting storage

`enableSystem={false}` governs what `next-themes` will *write*. It does not sanitise
what is already in `localStorage`, and the current build has been writing `system` to
real browsers. On the next visit `useTheme()` hands the component `theme === "system"`,
and `THEMES.indexOf("system")` on a two-item list returns `-1` — which would make the
"next" theme `THEMES[0]`, an answer that happens to work by accident and would silently
break if the array order changed.

So the component resolves the raw value through one named function before using it:

```ts
const resolveTheme = (stored: string | undefined): Theme =>
  stored === "light" ? "light" : "dark";
```

Everything downstream — the label, the `aria-label`, the next-theme computation — reads
that resolved value, so there is no path on which an unrecognised string reaches the UI.
Dark is the fallback because it is the new default: a learner who never expressed a
preference between the two real themes should land where a new learner lands.

Note this deliberately reads as "light, or else dark" rather than enumerating the invalid
inputs. `system` is the one value in the wild today, but the function's contract is
about the two themes that exist, not about the one legacy value — which means it stays
correct against a corrupted or hand-edited storage entry too.

**D2 as written above was half a fix, and visual verification is what caught it.**
Resolving the value for display corrects the *label*; it does nothing about the theme
actually applied, because the component does not own that — the provider does. Measured
in the running app with `system` in storage: `<html>` carried **no** theme class at all,
so the page fell through to the light `:root` tokens and rendered
`rgb(246, 241, 230)` while the toggle read "Theme: Dark". Label and reality disagreed,
which is a worse state than the one being fixed. Neither the component tests nor
Storybook could see it — Storybook's `withThemeByClassName` decorator owns the class
there, so the real behaviour only shows up against the app.

The persisted value therefore has to be *rewritten*, not merely reinterpreted. See D2b.

### D2b. Migrate in `GlobalProviders`, not in the toggle

`useLegacyThemeMigration` (in `src/hooks/`, matching the `use-is-hydrated` precedent)
calls `setTheme("dark")` once when the stored theme is outside the recognised set. It is
mounted in `GlobalProviders` rather than in `ThemeToggle` for two reasons: `GlobalProviders`
already exists to hold app-wide client concerns and sits inside `ThemeProvider`, and it
renders on every route — a learner must be migrated whether or not the view they landed
on happens to show a theme control.

The hook returns early on `theme === undefined`. That is the provider before it has read
storage, not an unrecognised value; migrating then would overwrite a stored `light`
preference before anyone had seen it.

`resolveTheme` in the component stays. The two are complementary rather than redundant:
the hook fixes the persisted state on the next tick, and `resolveTheme` keeps the label
honest on the render before that effect commits.

### D3. Replace the modulo cycle with an explicit swap

With two states, `THEMES[(index + 1) % length]` is indirection over a two-element array:

```ts
const nextTheme: Theme = theme === "dark" ? "light" : "dark";
```

The `THEMES` array and the modulo go away with it. What the button does is now legible
in the line that does it, and the `Theme` union narrows to `"light" | "dark"` so the
type system rejects a third state rather than an array length governing it.

### D4. Delete `ThemeToggle.system` from all three catalogues

Leaving the key costs nothing at runtime but leaves a translated string for a state that
cannot occur — the kind of dead copy that gets resurrected by a later contributor who
finds it and assumes it is wired to something. It goes from `en`, `es`, and `pt`
together; `messages.test.ts` compares key sets across locales, so removing it from two
of three fails loudly, which is the guard working.

### D5. `colorScheme` is not set, and that is deliberate

`next-themes` can write a `color-scheme` CSS property to style form controls and
scrollbars. The project does not set it today, and the app is no longer following the OS
in either direction, so introducing it here would be an unrelated visual change riding
along on a behavioural one. Left alone.

## Risks / Trade-offs

- **A learner on a light-mode OS now gets dark on first load.** That is the request, and
  it is a real change in what they see. → The light theme is one press away and the
  choice persists. Called out in the proposal rather than buried.
- **The migration path is exercised by nobody's browser in CI.** The `system` value only
  exists in storage that a previous build wrote. → Covered by a component test that
  feeds `theme: "system"` directly, which is exactly what `useTheme()` would return in
  that situation, plus a Storybook story that mounts the provider with it.
- **`themes={["dark", "light"]}` duplicates knowledge with the component's `Theme`
  union.** Two places now list the themes. → Accepted: the provider needs a runtime
  array and the component needs a compile-time union, and a shared constant exported
  across the client/server boundary for two string literals costs more than it saves.
  If a third theme ever arrives, both are in the failing path immediately.
- **`disableTransitionOnChange` keeps the swap instant.** With a two-state toggle the
  swap happens more often, so a transition would be more noticeable — but this is
  already set and stays set. No change, noted so it is not "fixed" later.

## Testing strategy

**Vitest component + RTL** — `src/components/theme-toggle/theme-toggle.test.tsx`, which
already mocks `next-themes`'s `useTheme` and the `useIsHydrated` hook directly and
controls their return values per test. That existing setup is exactly what is needed to
drive theme states, including invalid ones, so it is extended rather than replaced:

- Clicking while `dark` calls `setTheme("light")`, and clicking while `light` calls
  `setTheme("dark")` — replacing the three existing cycle tests
  (`light → dark`, `dark → system`, `system → light`).
- `setTheme` is never called with `"system"`, from either state. This is the guard that
  the third state is gone rather than merely unreachable by one path.
- Given `theme: "system"`, the button reports dark and clicking it calls
  `setTheme("light")` — the D2 migration, tested through the same seam a real returning
  learner would come through.
- The existing accessible-name assertions from `mobile-viewport-fit` stay untouched and
  must keep passing: `aria-label` of `label: dark`, the theme name present in the DOM
  for wider viewports, and the pre-hydration placeholder still named.
- The existing `faker`-driven fuzz test picks from `["light", "dark", "system"]`; its
  pool narrows to the two real themes.

**Vitest unit** — `src/hooks/use-legacy-theme-migration/use-legacy-theme-migration.test.tsx`
covers D2b through the same seam a returning learner arrives through: a stored `system`
is rewritten to dark, an arbitrary stored value is too, both recognised themes are left
untouched, and `undefined` writes nothing.

`src/messages/messages.test.ts` needs no new case. It already asserts
an identical key set across the three catalogues, so it fails if `ThemeToggle.system` is
removed from some and not all. Run it as the guard for D4 rather than writing a new
assertion that duplicates it.

**Playwright e2e** — no new spec. Theme behaviour has no e2e coverage today and this
change does not add a layout or navigation concern; the state machine is fully
observable in RTL. `e2e/cinema-theme.spec.ts` exercises the chrome and must keep
passing unchanged.

**Storybook + Playwright MCP** — driven by me, not handed back: the `InSystemMode` story
is replaced by one that mounts `ThemeProvider` with a stored `system` to show the
migration landing on dark, and the `Default` / `InDarkMode` stories are checked to
confirm one press swaps and the label reads the right theme in both.
