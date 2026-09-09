import { cn } from "@/lib/utils/utils";

/**
 * A thin gold meter with its reading beside it.
 *
 * @remarks
 * Presentational and nothing else: it reads no storage, calls no hook and
 * formats no copy. Both labels are passed in already localized, so the two
 * islands that use it — one counting seconds of a video, one counting
 * lessons of a module — differ in what they count without differing in how
 * a bar looks.
 *
 * The state never rests on the fill alone: the bar carries
 * `role="progressbar"` with its value and bounds for assistive technology,
 * and the visible `label` states the same thing in text for a learner who
 * cannot separate the gold from the track.
 *
 * The fill is clamped, so an out-of-range value — a stored position past a
 * lesson's duration, say — draws a full bar rather than overflowing its
 * track.
 *
 * @param value - Where the learner is: watched percent, or completed lessons
 * @param max - The upper bound: `100` for a percentage, the lesson count otherwise
 * @param label - The visible reading, localized (e.g. `40%`, `7 / 17 videos`)
 * @param ariaLabel - The accessible name, localized and self-contained
 * @param className - Extra classes for the wrapper
 *
 * @example
 * ```tsx
 * <WatchProgressBar value={40} max={100} label="40%" ariaLabel="40% watched" />
 * ```
 */
export function WatchProgressBar({
  value,
  max,
  label,
  ariaLabel,
  className,
}: {
  value: number;
  max: number;
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  const filledPercent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/15"
      >
        <div
          data-testid="watch-progress-fill"
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${filledPercent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{label}</span>
    </div>
  );
}
