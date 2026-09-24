# Proposal: theme-toggle-only-in-profile

## Why

The theme control currently lives in three places: the site header's chip, the avatar menu's phone theme item, and the Profile page's Preferences section. The header placements crowd a bar that already sheds content at phone widths, and they duplicate a setting the Profile page owns. The user wants one home for the theme: the Profile page.

## What Changes

- The site header no longer renders the theme toggle chip at any width or session state.
- The avatar menu no longer offers the phone theme item (`PhoneThemeItem`); the theme toggle no longer "moves into the menu" below `sm` because it no longer exists in the header at all.
- The only way to change the theme becomes the existing `ThemeToggle` in the Profile page's Preferences section (`/[locale]/profile`), which is unchanged.
- **BREAKING** for the `cinema-home` header contract: several scenarios that assert the header/menu theme control are removed or rewritten.
- Header layout simplifies: with one fewer 44px control, the phone-width constraint that forced the theme control into the avatar menu disappears.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-home`: the global-header requirement drops the theme toggle chip and the avatar-menu theme item; the header keeps only the locale switcher and the account control, and the requirement points theme changes to the Profile page.

## Non-goals

- No change to the Profile page's Preferences section or the `profile-page` spec — the theme control there already exists and stays as-is.
- No change to the `ThemeToggle` or `ThemeSwitchTrack` components themselves — they remain (Profile still uses `ThemeToggle`; the theme-switch-track stays as its visual). Their stories and tests stay.
- No change to theme persistence, `useThemeChoice`, or `next-themes` wiring.
- No removal of unused translation keys beyond those that become dead (`SiteHeader`-side theme copy is evaluated during implementation; `ThemeToggle` namespace stays because Profile uses it).

## Impact

- `src/components/site-header/site-header.tsx` — remove the `ThemeToggle` chip, the `PhoneThemeItem` menu item, and the now-unused `ThemeSwitchTrack` import.
- `src/components/site-header/site-header.test.tsx` — drop/replace the assertions about `header-theme-toggle` visibility classes and the menu theme item.
- `e2e/mobile-viewport.spec.ts` — the phone-width scenarios that assert the theme control's placement (header chip hidden, menu item present) change to assert the toggle is simply absent from the header and menu.
- `openspec/specs/cinema-home/spec.md` — delta spec removes/modifies the theme-related scenarios of the header requirement.
- Profile page (`profile-view.tsx`) — untouched.
