"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/** The only themes the app recognises, matching the provider's `themes` list. */
const RECOGNISED_THEMES = new Set(["dark", "light"]);

/**
 * Client hook: rewrites a stored theme the app no longer recognises to `dark`.
 *
 * @remarks
 * An earlier build ran `<ThemeProvider enableSystem>` and persisted `"system"`
 * to real browsers. Turning `enableSystem` off governs what `next-themes` will
 * *write* from now on; it does nothing about what is already in a returning
 * learner's `localStorage`.
 *
 * That gap is not cosmetic. Given a stored value outside its theme list,
 * `next-themes` applies **no** class to `<html>` at all — so the page falls
 * through to the light `:root` tokens while any control reading the theme
 * reports dark. The learner sees one theme and the toggle names the other.
 * Resolving the value for display is therefore not enough; the persisted value
 * itself has to be corrected, which is what this hook does.
 *
 * Dark is the target because it is the app's default: someone who never chose
 * between the two real themes should land where a first-time visitor lands.
 *
 * The rule is "not one of the two recognised themes" rather than a check for
 * `"system"` specifically, so a corrupted or hand-edited entry migrates on the
 * same path as the one legacy value in the wild.
 *
 * Mount it once, inside the `ThemeProvider` — {@link "@/components/global-providers"}
 * is where it lives, so the migration runs on every route rather than only
 * those that happen to render a theme control.
 *
 * @example
 * ```tsx
 * export function GlobalProviders({ children }: { children: React.ReactNode }) {
 *   useLegacyThemeMigration();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useLegacyThemeMigration(): void {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // `undefined` is the provider before it has read storage, not an
    // unrecognised value — migrating then would clobber a stored preference
    // before it had ever been seen.
    if (theme === undefined) return;
    if (RECOGNISED_THEMES.has(theme)) return;

    setTheme("dark");
  }, [theme, setTheme]);
}
