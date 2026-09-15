import { cn } from "@/lib/utils/utils";

import { Moon, Sun } from "lucide-react";

/**
 * The visual of the theme switch: a pill track with a sun and a moon, and a
 * thumb that slides to the theme in use with a slight overshoot.
 *
 * @remarks
 * Purely presentational and hidden from assistive technology — the control
 * wearing it (`ThemeToggle`, the avatar menu's theme item) owns the role, the
 * checked state and the accessible name.
 *
 * The thumb carries the icon of the active theme, crossfading and turning as
 * it slides. Every transition is dropped under `prefers-reduced-motion`.
 *
 * 44px wide, so the switch alone fits the header's phone width budget.
 *
 * @param isDark - Whether the thumb sits at the dark end
 * @param className - Extra classes for the track
 */
export function ThemeSwitchTrack({ isDark, className }: { isDark: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-state={isDark ? "dark" : "light"}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300 motion-reduce:transition-none",
        isDark ? "border-primary/45 bg-primary/15" : "border-border bg-secondary",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute left-1.5 size-3 transition-opacity duration-300 motion-reduce:transition-none",
          isDark ? "text-muted-foreground opacity-60" : "opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute right-1.5 size-3 transition-opacity duration-300 motion-reduce:transition-none",
          isDark ? "opacity-0" : "text-muted-foreground opacity-60",
        )}
      />
      <span
        className={cn(
          "absolute top-1/2 left-0.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-[translate,background-color,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
          isDark
            ? "translate-x-[1.125rem] bg-primary text-primary-foreground"
            : "translate-x-0 bg-foreground text-background",
        )}
      >
        <Sun
          className={cn(
            "absolute size-3 transition-[opacity,rotate,scale] duration-300 motion-reduce:transition-none",
            isDark ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-3 transition-[opacity,rotate,scale] duration-300 motion-reduce:transition-none",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0",
          )}
        />
      </span>
    </span>
  );
}
