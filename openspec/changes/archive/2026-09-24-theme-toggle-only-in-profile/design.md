# Design: theme-toggle-only-in-profile

## Context

`SiteHeader` (`src/components/site-header/site-header.tsx`) renders a `ThemeToggle` chip in the header row (wrapped in a `data-testid="header-theme-toggle"` span that hides below `sm` when the learner menu is present) and a `PhoneThemeItem` inside the avatar dropdown (visible only below `sm`). The Profile page's Preferences section (`profile-view.tsx:203`) renders its own `ThemeToggle`, governed by the `profile-page` spec, which already requires it.

The `cinema-home` spec's "Global header shows brand and section chrome" requirement mandates both header placements. Removing them is a spec-level behavior change to that one requirement.

## Goals / Non-Goals

**Goals:**

- The header renders no theme control, at any width, signed in or out.
- The avatar menu offers no theme item.
- The Profile page's Preferences theme control remains the only way to change the theme.
- Specs, unit tests and e2e tests describe the new contract, not the old one.

**Non-Goals:**

- No changes to `ThemeToggle`, `ThemeSwitchTrack`, `useThemeChoice`, or theme persistence.
- No changes to `profile-view.tsx` or the `profile-page` spec.
- No redesign of what fills the freed header space — the remaining controls simply keep their layout.

## Decisions

1. **Delete, don't hide.** Remove the `<span data-testid="header-theme-toggle">…</span>` block and the `<PhoneThemeItem />` element plus the whole `PhoneThemeItem` function from `site-header.tsx`, along with the now-unused imports (`ThemeToggle`, `ThemeSwitchTrack`, `useThemeChoice`). CSS-hiding would leave dead interactive code and keep the spec ambiguous.

2. **Keep `ThemeToggle` and `ThemeSwitchTrack` components untouched.** Profile uses `ThemeToggle`; `ThemeSwitchTrack` remains `ThemeToggle`'s visual track. Their colocated stories/tests stay. `install-app-button.stories.tsx` also composes `ThemeToggle` for a story scene — unaffected.

3. **Translations stay.** The `ThemeToggle` namespace serves the Profile toggle. `SiteHeader` has no theme-specific keys of its own (`PhoneThemeItem` reads `ThemeToggle` keys), so no message-file edits are needed.

4. **Spec delta rewrites one requirement.** The `cinema-home` delta modifies "Global header shows brand and section chrome": drop the theme toggle from the chip list, delete the paragraph that moves the theme control into the avatar menu below `sm`, adjust the shedding-order and hit-area paragraphs to speak only of the locale control, and replace/remove the theme scenarios. A new scenario asserts the header offers no theme control and the menu no theme item.

5. **Simplified phone layout falls out for free.** With one fewer 44px control the header row fits at 320px with a profile without the menu absorbing anything; the existing 320px-fit scenarios keep guarding overflow.

## Risks / Trade-offs

- [Discoverability: learners used to the header chip must find the theme in Profile] → The Profile page is one menu item away via the avatar; the setting is not lost, just centralized. This is the explicit intent of the change.
- [Signed-out visitors have no theme control at all (Profile requires sign-in)] → Accepted; the system theme preference (`next-themes` default) still applies. Called out here so it is a conscious product decision, not an oversight.
- [e2e drift: `mobile-viewport.spec.ts` measures the theme control's box at 320px] → Those assertions are updated in the same change; running the suite locally before merge catches stragglers (`main` runs no CI).

## Migration Plan

Single PR, no data or config migration. Rollback is reverting the commit.

## Testing strategy

| Behavior                                                                    | Layer                  | File / pattern                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header renders no theme control (signed out, signed in, with learner card)   | Vitest component + RTL | `src/components/site-header/site-header.test.tsx` — rewrite the three `header-theme-toggle` assertions into `queryByTestId(...)`/`queryByRole("switch"|"button", {name:/theme/i})` absence checks                     |
| Avatar menu has no theme item                                                | Vitest component + RTL | same file — replace the three `PhoneThemeItem` tests with one absence test (open menu, no `menuitem` named `label: …`)                                                                                               |
| Profile still offers the theme toggle                                        | Vitest component + RTL | existing `profile-view` tests already cover it; verify they pass unchanged                                                                                                                                          |
| 320px header fit with a learner card, no theme in menu                       | Playwright e2e         | `e2e/mobile-viewport.spec.ts` — drop the header-theme-toggle hidden/box/hit-area expectations from `headerControls`; keep locale-control and overflow assertions; assert the theme control is absent from the banner |

TDD order per task: first change the test to expect absence (red), then delete the production code (green).

## Open Questions

_None — scope confirmed by the user: only the Profile toggle survives._
