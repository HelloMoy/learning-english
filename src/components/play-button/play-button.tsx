import { cn } from "@/lib/utils/utils";

import { Play } from "lucide-react";

const SIZES = {
  sm: "size-9 [&_svg]:size-3.5",
  md: "size-11 [&_svg]:size-4",
  lg: "size-14 [&_svg]:size-6",
} as const;

/**
 * The circular gold play affordance. Two modes:
 *
 *   - `decorative` (default) — a non-interactive `<span aria-hidden>` used
 *     INSIDE another control (e.g. a PosterCard link or an episode row),
 *     so it never nests a button inside a link.
 *   - interactive — pass `decorative={false}` and a `label` to render a real
 *     `<button>` with an accessible name (used standalone, e.g. a hero).
 */
export function PlayButton({
  size = "md",
  decorative = true,
  label,
  onClick,
  className,
}: {
  size?: keyof typeof SIZES;
  decorative?: boolean;
  label?: string;
  onClick?: () => void;
  className?: string;
}) {
  const shape = cn(
    "inline-flex items-center justify-center rounded-full bg-gold text-[color:var(--primary-foreground)] shadow-[0_2px_20px_color-mix(in_oklab,var(--glow)_45%,transparent)]",
    SIZES[size],
    className,
  );

  if (decorative) {
    return (
      <span
        aria-hidden="true"
        className={shape}
      >
        <Play fill="currentColor" />
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        shape,
        "transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100",
      )}
    >
      <Play fill="currentColor" />
    </button>
  );
}
