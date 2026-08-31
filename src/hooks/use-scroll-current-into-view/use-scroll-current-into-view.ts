"use client";

import { centeredScrollTop } from "@/lib/centered-scroll-top/centered-scroll-top";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * The row a navigation region marks as the one the reader is on. Resolving
 * it by attribute rather than by a passed-in ref keeps this hook independent
 * of how the region builds its rows.
 */
const CURRENT_ROW_SELECTOR = '[aria-current="page"]';

/**
 * React warns when `useLayoutEffect` runs during server rendering, and the
 * outline is part of the lesson page's server-rendered HTML. There is no
 * layout to measure on the server, so the effect degrades to `useEffect`
 * there; in the browser the layout effect is what keeps the region from
 * painting at offset 0 and then jumping.
 */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Client hook: scrolls a region so the row it marks with
 * `aria-current="page"` sits in the middle of its visible area.
 *
 * @remarks
 * Attach the returned ref to the scrollable region — not to the row. The
 * hook finds the row itself, measures both, and writes the region's
 * `scrollTop` once, before paint.
 *
 * It deliberately does **not** use `Element.scrollIntoView()`. That method
 * scrolls every scrollable ancestor, including the document, which on a page
 * whose only other scroll container is the document would drag the reader
 * away from the content they just opened. Assigning `scrollTop` moves
 * exactly one element and nothing above it.
 *
 * The adjustment is instant for everyone — there is no smooth-scroll branch
 * and therefore nothing for `prefers-reduced-motion` to suppress. The region
 * should read as having always been in the right place.
 *
 * `isActive` exists for regions that have no layout until the reader opens
 * them, such as the contents of a closed `<details>`: measuring one of those
 * at mount yields zeroes. Pass the region's open state and the hook measures
 * when it turns true. A region that is visible from the start passes `true`.
 *
 * Nothing happens when the region is absent or holds no current row — the
 * region keeps whatever offset it has.
 *
 * @param isActive - Whether the region is laid out and worth measuring
 * @returns A ref to attach to the scrollable region
 *
 * @example
 * ```tsx
 * const outlineRef = useScrollCurrentIntoView<HTMLElement>(true);
 * return <aside ref={outlineRef} className="overflow-y-auto">{outline}</aside>;
 * ```
 */
export function useScrollCurrentIntoView<TRegion extends HTMLElement>(
  isActive: boolean,
): RefObject<TRegion | null> {
  const regionRef = useRef<TRegion | null>(null);

  useMeasureEffect(() => {
    const region = regionRef.current;
    if (!isActive || !region) return;

    const currentRow = region.querySelector(CURRENT_ROW_SELECTOR);
    if (!currentRow) return;

    const rowBox = currentRow.getBoundingClientRect();
    const regionBox = region.getBoundingClientRect();

    region.scrollTop = centeredScrollTop({
      // Rect tops are viewport-relative, so their difference is the row's
      // offset within what the region currently shows; adding the region's
      // own offset lifts that back into content coordinates. `offsetTop`
      // would be simpler but is measured from the nearest positioned
      // ancestor, which differs between the regions this hook serves.
      rowOffsetTop: rowBox.top - regionBox.top + region.scrollTop,
      rowHeight: rowBox.height,
      regionHeight: region.clientHeight,
      maxScrollTop: region.scrollHeight - region.clientHeight,
    });
  }, [isActive]);

  return regionRef;
}
