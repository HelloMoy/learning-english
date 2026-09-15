"use client";

import { ThemeSwitchTrack } from "@/components/theme-switch-track/theme-switch-track";
import { useThemeChoice } from "@/hooks/use-theme-choice/use-theme-choice";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";

/**
 * The header control's shape: a bare 44×44 switch on a phone, a chip with the
 * theme's name from `sm` up — the header's phone width budget has no room for
 * a chip.
 */
const CONTROL_CLASSES =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-md text-xs text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:border sm:border-border sm:bg-foreground/5 sm:px-3";

/**
 * Theme switch backed by `next-themes`.
 *
 * Note: `next-themes@0.4.6` emits a React 19 warning of the form
 * "Encountered a script tag while rendering React component" because
 * its `<ThemeProvider>` injects a FOUC-prevention `<script>` via
 * `React.createElement("script", { dangerouslySetInnerHTML })`. The
 * warning is non-blocking and is tracked upstream in next-themes for
 * post-0.4. We keep `next-themes` rather than reimplementing the
 * provider. See `openspec/changes/polish-lesson-view-ux/design.md` §D6.
 *
 * A `role="switch"`, checked while dark is active, wearing
 * {@link ThemeSwitchTrack}. The accessible name keeps naming the current theme
 * (`Theme: Dark`) at every width, as the header requires. Pressing it slides
 * the thumb first and applies the theme once the slide has played — see
 * `useThemeChoice`.
 *
 * Until the theme is known on the client — the server render, the hydration
 * render, and before the provider has read storage — a disabled placeholder of
 * the same shape renders, so both passes emit the same HTML.
 *
 * One press always reaches the other theme. There is no third state:
 * Immersion Cinema is a dark design, so dark is the default and light is the
 * alternate a learner opts into.
 */
export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const choice = useThemeChoice();

  if (!choice) {
    return (
      <button
        type="button"
        aria-label={t("label")}
        className={CONTROL_CLASSES}
        disabled
      >
        <span
          aria-hidden="true"
          className="h-6 w-11 rounded-full border border-border bg-secondary"
        />
      </button>
    );
  }

  const isDark = choice.currentTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`${t("label")}: ${t(choice.currentTheme)}`}
      onClick={choice.toggle}
      className={cn(
        CONTROL_CLASSES,
        "cursor-pointer transition-colors hover:text-foreground sm:hover:bg-foreground/10",
      )}
    >
      <ThemeSwitchTrack isDark={isDark} />
      {/* Both names share one grid cell so the chip keeps the width of the
          longer one and never jumps while the thumb slides. */}
      <span
        aria-hidden="true"
        className="hidden grid-cols-1 grid-rows-1 text-left sm:grid"
      >
        <span className={cn("col-start-1 row-start-1", !isDark && "invisible")}>{t("dark")}</span>
        <span className={cn("col-start-1 row-start-1", isDark && "invisible")}>{t("light")}</span>
      </span>
    </button>
  );
}
