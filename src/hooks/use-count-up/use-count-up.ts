"use client";

import { useEffect, useState } from "react";

/** How long a count takes to climb from zero to its value. */
export const COUNT_UP_DURATION_MS = 900;

/**
 * Without `matchMedia` there is no way to know the learner's preference, so the
 * count stays still rather than risk moving for someone who asked it not to.
 */
const shouldStayStill = (): boolean =>
  typeof window === "undefined" ||
  typeof window.matchMedia !== "function" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

/**
 * A number that climbs from zero to `target`, for counts that should feel earned.
 *
 * @remarks
 * The climb eases out over {@link COUNT_UP_DURATION_MS} on animation frames.
 * Under `prefers-reduced-motion: reduce`, or where the preference cannot be
 * read, the hook returns `target` from the first render.
 *
 * The value is for eyes only: a caller SHALL render it hidden from assistive
 * technology beside the final sentence, so a screen reader never announces a
 * number on its way up.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @example
 * ```tsx
 * const shown = useCountUp(ticketsEarned);
 * return (
 *   <p>
 *     <span aria-hidden="true">{shown}</span>
 *     <span className="sr-only">{t("ticketCount", { earned: ticketsEarned })}</span>
 *   </p>
 * );
 * ```
 *
 * @param target - The value the count ends on
 * @returns The value to show on this frame
 */
export function useCountUp(target: number): number {
  const [isStill] = useState(shouldStayStill);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (isStill || target === 0) return;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function climb() {
      const progress = Math.min((performance.now() - startedAt) / COUNT_UP_DURATION_MS, 1);
      setShown(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(climb);
    });
    return () => cancelAnimationFrame(frame);
  }, [isStill, target]);

  return isStill || target === 0 ? target : shown;
}
