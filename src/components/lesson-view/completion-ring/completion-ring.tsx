import type { ReactNode } from "react";

/** The ring's stroke as a share of its size, so a row ring and a tile ring read alike. */
const STROKE_RATIO = 0.12;

/**
 * A small circular completion indicator for the course outline.
 *
 * @remarks
 * It differs from the course overview's `ProgressRing` in the one way the
 * outline depends on: at a fraction of zero it draws **no fill at all**. A
 * zero-length dash still paints its cap, which would show a dot reading as
 * "started" on a lesson the learner has not touched — or, before hydration,
 * on one whose progress the page cannot know yet. The stroke also scales with
 * the size rather than collapsing to a hairline at row size, and there is no
 * glow.
 *
 * The drawing is decorative: whatever it means must be said by `children` or
 * by nearby text, so the SVG is hidden from assistive technology.
 *
 * @example
 * ```tsx
 * <CompletionRing size={44} fraction={0.33}>33%</CompletionRing>
 * ```
 *
 * @param size - Outer width and height, in pixels
 * @param fraction - The completed share, clamped to the unit range; `0` draws the track alone
 * @param children - Content centred inside the ring, such as a percentage or an icon
 */
export function CompletionRing({
  size,
  fraction,
  children,
}: {
  size: number;
  fraction: number;
  children?: ReactNode;
}) {
  const strokeWidth = Math.round(size * STROKE_RATIO);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filledLength = circumference * clampToUnit(fraction);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          data-testid="completion-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-foreground/15"
        />
        {filledLength > 0 ? (
          <circle
            data-testid="completion-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-gold"
            strokeDasharray={`${filledLength} ${circumference}`}
          />
        ) : null}
      </svg>
      {children}
    </span>
  );
}

function clampToUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
