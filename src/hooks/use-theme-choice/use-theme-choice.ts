"use client";

import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { useTheme } from "next-themes";
import { useState } from "react";

/** The two themes the app recognises. */
export type ThemeName = "light" | "dark";

/**
 * How long the theme switch's thumb takes to slide before the theme applies.
 * Kept in step with the `duration-300`-class slide in `ThemeSwitchTrack`.
 */
export const THEME_SWITCH_MS = 260;

/**
 * Resolve whatever `next-themes` hands us into one of the two themes.
 *
 * An earlier build ran with `enableSystem` and persisted `"system"` to real
 * browsers, so that value can still come back from storage. Dark is the
 * default, so anything that is not an explicit choice of light lands there.
 */
const resolveTheme = (stored: string | undefined): ThemeName =>
  stored === "light" ? "light" : "dark";

const otherTheme = (theme: ThemeName): ThemeName => (theme === "dark" ? "light" : "dark");

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * Client hook: the theme a theme control shows, and a way to switch to the
 * other one.
 *
 * @remarks
 * Shared by every theme control — the header switch and the avatar menu's
 * phone item — so they resolve legacy values and swap themes the same way.
 *
 * `toggle` flips the shown theme at once and applies it after
 * {@link THEME_SWITCH_MS}. The provider runs with `disableTransitionOnChange`,
 * which suspends every CSS transition at the instant a theme applies; applying
 * it in the same frame would freeze the switch's slide mid-way. Under
 * `prefers-reduced-motion: reduce` there is no slide to wait for, so the theme
 * applies immediately.
 *
 * Returns `null` on the server and during hydration, and while `next-themes`
 * has not read storage: a control rendered then would mismatch the server
 * HTML (see `useIsHydrated`).
 *
 * @returns The shown theme and `toggle`, or `null` while the theme is unknown
 *
 * @example
 * ```tsx
 * const choice = useThemeChoice();
 * if (!choice) return <Placeholder />;
 * return <button onClick={choice.toggle}>{choice.currentTheme}</button>;
 * ```
 */
export function useThemeChoice(): { currentTheme: ThemeName; toggle: () => void } | null {
  const { theme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();
  const [switchingTo, setSwitchingTo] = useState<ThemeName | null>(null);

  if (!isHydrated || theme === undefined) return null;

  const currentTheme = switchingTo ?? resolveTheme(theme);

  const toggle = () => {
    const nextTheme = otherTheme(currentTheme);
    const apply = () => {
      setTheme(nextTheme);
      setSwitchingTo(null);
    };
    setSwitchingTo(nextTheme);
    if (prefersReducedMotion()) apply();
    else window.setTimeout(apply, THEME_SWITCH_MS);
  };

  return { currentTheme, toggle };
}
