"use client";

import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

type Theme = "light" | "dark";

/**
 * Resolve whatever `next-themes` hands us into one of the two themes the app
 * recognises.
 *
 * An earlier build ran with `enableSystem` and persisted `"system"` to real
 * browsers, so that value is still in learners' `localStorage` and is what
 * `useTheme()` returns on their next visit. Disabling `enableSystem` governs
 * what the library will *write*; it does not sanitise what is already stored.
 *
 * The rule is deliberately "light, or else dark" rather than a list of the
 * invalid inputs: dark is the default, so anything that is not an explicit
 * choice of light lands there — which keeps this correct against a corrupted
 * or hand-edited storage entry, not just against the one legacy value.
 */
const resolveTheme = (stored: string | undefined): Theme => (stored === "light" ? "light" : "dark");

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
 * Swaps between `dark` and `light` on click — one press always reaches the
 * other theme. There is no third state: Immersion Cinema is a dark design, so
 * dark is the default and light is the alternate a learner opts into, rather
 * than either being selected on their behalf by an OS setting. Keyboard
 * accessible via the native `<button>` element.
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
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-border bg-foreground/5 px-3 text-xs text-muted-foreground"
        disabled
      >
        …
      </button>
    );
  }

  const currentTheme = resolveTheme(theme);
  const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`${t("label")}: ${t(currentTheme)}`}
      onClick={() => setTheme(nextTheme)}
      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-foreground/5 px-3 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span aria-hidden="true">◐</span>
      <span className="hidden sm:inline">{t(currentTheme)}</span>
    </button>
  );
}
