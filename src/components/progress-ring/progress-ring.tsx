import { cn } from "@/lib/utils/utils";

const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * A progress ring: a track with a gold arc for the completed share, and a
 * label — usually the percentage — as real text in its middle.
 *
 * @remarks
 * The drawing is decorative; the label carries the meaning, so it is read out
 * with whatever surrounds the ring. An empty share draws no arc rather than the
 * dot a zero-length round-capped stroke would leave.
 *
 * The ring is 44px by default; size it with `className` (it scales with the
 * box) and set the label's size and colour with `labelClassName`.
 *
 * @example
 * ```tsx
 * <ProgressRing share={0.24} label="24%" className="size-[4.5rem]" labelClassName="text-sm" />
 * ```
 *
 * @param share - The completed share, in `[0, 1]`
 * @param label - The text in the middle of the ring
 * @param className - Classes for the ring's box, such as its size
 * @param labelClassName - Classes for the label, such as its size and colour
 */
export function ProgressRing({
  share,
  label,
  className,
  labelClassName,
}: {
  share: number;
  label: string;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <span className={cn("relative flex size-11 shrink-0 items-center justify-center", className)}>
      <svg
        viewBox="0 0 44 44"
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="22"
          cy="22"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="5"
          className="stroke-secondary"
        />
        {share > 0 ? (
          <circle
            data-slot="progress-ring-arc"
            cx="22"
            cy="22"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${share * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            className="stroke-primary"
          />
        ) : null}
      </svg>
      <span
        className={cn(
          "relative text-[11px] font-extrabold whitespace-nowrap tabular-nums",
          labelClassName,
        )}
      >
        {label}
      </span>
    </span>
  );
}
