"use client";

import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

type Theme = "light" | "dark" | "system";

const THEMES: Theme[] = ["light", "dark", "system"];

/**
 * Theme switcher backed by `next-themes`.
 *
 * Note: `next-themes@0.4.6` emits a React 19 warning of the form
 * "Encountered a script tag while rendering React component" because
 * its `<ThemeProvider>` injects a FOUC-prevention `<script>` via
 * `React.createElement("script", { dangerouslySetInnerHTML })`. The
 * warning is non-blocking and is tracked upstream in next-themes for
 * post-0.4. We keep `next-themes` rather than reimplementing the
 * provider. See `openspec/changes/polish-lesson-view-ux/design.md` §D6.
 *
 * `next-themes`'s `useTheme()` returns `undefined` on the server, but by
 * the client's *hydration* render the provider has already read
 * `localStorage` — so `theme` is populated there. Gating on
 * `theme === undefined` alone therefore renders the placeholder on the
 * server and the real button during hydration, which is exactly the
 * mismatch it was meant to prevent. {@link useIsHydrated} closes the gap:
 * it reports `false` for both the server render and the hydration render,
 * so the placeholder is what both passes emit.
 *
 * Cycles through `light` → `dark` → `system` on click. Keyboard accessible
 * via the native `<button>` element.
 */
export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const { theme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();

  if (!isHydrated || theme === undefined) {
    return (
      <button
        type="button"
        aria-label={t("label")}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-foreground/5 px-3 py-1.5 text-xs text-muted-foreground"
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
      className="inline-flex items-center gap-2 rounded-md border border-border bg-foreground/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span aria-hidden="true">◐</span>
      {t(theme as Theme)}
    </button>
  );
}
