"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

type Theme = "light" | "dark" | "system";

const THEMES: Theme[] = ["light", "dark", "system"];

/**
 * Theme switcher backed by `next-themes`.
 *
 * `next-themes`'s `useTheme()` returns `undefined` until the component has
 * mounted on the client (the theme value lives in localStorage and isn't
 * available on the server). We render a stable placeholder while
 * `theme === undefined` to avoid a hydration mismatch — no `useState` /
 * `useEffect` / `mounted` flag needed, which sidesteps the React 19
 * `react-hooks/set-state-in-effect` lint rule.
 *
 * Cycles through `light` → `dark` → `system` on click. Keyboard accessible
 * via the native `<button>` element.
 */
export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const { theme, setTheme } = useTheme();

  if (theme === undefined) {
    return (
      <button
        type="button"
        aria-label={t("label")}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        disabled
      >
        …
      </button>
    );
  }

  const currentIndex = THEMES.indexOf(theme as Theme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  const nextTheme = THEMES[nextIndex]!;

  return (
    <button
      type="button"
      aria-label={`${t("label")}: ${t(theme as Theme)}`}
      onClick={() => setTheme(nextTheme)}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      {t(theme as Theme)}
    </button>
  );
}
