import { cn } from "@/lib/utils/utils";

import type { ReactNode } from "react";

/** The gap, in pixels along the circle, between two segments of a segmented ring. */
const SEGMENT_GAP_PX = 4;

type ProgressRingProps = {
  /** Outer width and height of the ring, in pixels. */
  size: number;
  /** Content centred inside the ring — typically a number and a caption. */
  children?: ReactNode;
  /**
   * Whether the fill casts its gold glow. Defaults to `true`. Turn it off when the
   * ring sits over artwork: the glow's filter paints over whatever lies behind the
   * ring's square box, which shows as a dark square on an image.
   */
  glow?: boolean;
} & ({ fraction: number; segments?: never } | { segments: number; fraction?: never });

/**
 * A circular progress indicator in the Immersion Cinema gold.
 *
 * @remarks
 * Two modes:
 *
 * - `fraction` fills the ring clockwise from the top to that share, clamped to
 *   the unit range — the "how far through this lesson" reading.
 * - `segments` splits the track into one dash per item and lights only the
 *   first — the "N videos, starting here" reading for something not begun.
 *
 * The drawing is decorative: whatever it means must be said by `children` or by
 * nearby text, so the SVG is hidden from assistive technology.
 *
 * @example
 * ```tsx
 * <ProgressRing size={220} fraction={0.12}>
 *   <span>12%</span>
 * </ProgressRing>
 * ```
 */
export function ProgressRing({
  size,
  fraction,
  segments,
  children,
  glow = true,
}: ProgressRingProps) {
  const strokeWidth = Math.round(size * 0.064);
  const radius = size / 2 - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;
  const segmentDash = segments ? circumference / segments - SEGMENT_GAP_PX : 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          data-testid="progress-ring-track"
          cx={centre}
          cy={centre}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={segments ? "stroke-gold/40" : "stroke-border"}
          strokeDasharray={segments ? `${segmentDash} ${SEGMENT_GAP_PX}` : undefined}
        />
        <circle
          data-testid="progress-ring-fill"
          cx={centre}
          cy={centre}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap={segments ? "butt" : "round"}
          className={cn(
            "stroke-gold",
            glow && "drop-shadow-[0_0_10px_color-mix(in_oklab,var(--glow)_60%,transparent)]",
          )}
          strokeDasharray={
            segments
              ? `${segmentDash} ${circumference}`
              : `${circumference * clampToUnit(fraction ?? 0)} ${circumference}`
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

function clampToUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
