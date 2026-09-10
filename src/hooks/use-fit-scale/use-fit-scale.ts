"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type FitScale = {
  /** Attach to the box whose height the content must fit inside. */
  ref: RefObject<HTMLDivElement | null>;
  /** `1`, or the factor that makes `naturalHeight` fit the measured box. */
  scale: number;
};

/**
 * Client hook: how far to shrink fixed-size content so it fits its container.
 *
 * @remarks
 * For content drawn at fixed pixel sizes that has to fit a box whose height is
 * not known in advance — the guide's mock iPhone inside a modal being the
 * motivating case.
 *
 * It measures rather than guessing. An earlier attempt used
 * `@media (max-height: …)` steps, which are guesses about device heights and
 * were wrong on the first real phone they met; the browser knows the actual
 * number and this asks it.
 *
 * Never returns more than `1`. The content is drawn at fixed pixel sizes, so
 * scaling past its natural size only blurs it, and the extra room is better
 * spent as whitespace.
 *
 * Apply the result with `transform: scale()`, which leaves the layout box at
 * its natural height. Give the measured container `overflow: hidden` so that
 * untouched height cannot produce a scrollbar — otherwise the shrinking is
 * cosmetic and the scroll it was meant to remove stays.
 *
 * @example
 * ```tsx
 * const { ref, scale } = useFitScale(PHONE_HEIGHT);
 *
 * <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
 *   <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
 *     <Phone />
 *   </div>
 * </div>
 * ```
 *
 * @param naturalHeight - The content's unscaled height in pixels
 * @returns A ref for the container, and the scale to apply to the content
 */
export function useFitScale(naturalHeight: number): FitScale {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const box = ref.current;
    if (!box || naturalHeight <= 0) return;

    const available = box.clientHeight;

    // Before layout the box measures 0; shrinking to nothing then would make
    // the content vanish on the first paint.
    if (available <= 0) return;

    setScale(Math.min(1, available / naturalHeight));
  }, [naturalHeight]);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(box);

    return () => observer.disconnect();
  }, [measure]);

  return { ref, scale };
}
