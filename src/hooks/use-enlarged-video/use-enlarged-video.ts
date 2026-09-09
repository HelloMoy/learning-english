"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Whether the lesson video is filling the viewport, and the two ways out of it.
 *
 * @category Hooks
 */
export type EnlargedVideo = {
  /** `true` while the player is pinned to the viewport. */
  isEnlarged: boolean;
  /** Enters the mode, or leaves it — what the enlarge control calls. */
  toggle: () => void;
  /** Leaves the mode; a no-op when the video is already in the page. */
  exit: () => void;
};

/**
 * Owns the lesson player's viewport-filling mode: the state, the `Escape` key,
 * and the place in the page to come back to.
 *
 * @remarks
 * This is the app's answer to a control the browser cannot supply. Safari on
 * iPhone exposes no element Fullscreen API at all, and a YouTube-sourced lesson
 * is served through an `<iframe>`, so there is no `<video>` to hand to the
 * platform's own `webkitEnterFullscreen`. Vidstack's fullscreen button reads
 * that as "unsupported" and hides itself, which leaves an iPhone learner with
 * no way to enlarge a lesson at all.
 *
 * The rule lives here rather than in the player component for the same reason
 * the resume and persistence rules do: it is about the learner, not about a
 * media library, and it is worth testing without rendering a player.
 *
 * `Escape` is handled here rather than through Vidstack's own keyboard
 * shortcuts, which the player suppresses whenever an overlay owns the
 * keyboard — precisely when a learner most wants out.
 *
 * **The page behind the mode is deliberately not locked.** Safari on iPhone
 * hides its toolbar only for a real scroll gesture on the document, and that
 * gesture passes straight through the pinned player to the page beneath. A
 * swipe over the video is therefore the one way the enlarged video reaches the
 * whole screen once the phone is rotated, and it works only while the document
 * can still scroll; a `body { overflow: hidden }` lock is exactly what kept the
 * video wedged under the toolbar. None of that scrolling shows — the backdrop
 * covers the page.
 *
 * What the gesture moves is put back on the way out: the page's vertical
 * offset at entry is restored once the mode has left, so the player is where
 * the learner left it rather than under the sticky header. The restore waits
 * for the exit to commit, so the page is scrolled in its in-flow layout, and it
 * never runs on unmount — that is a navigation, and the next page has its own
 * place.
 *
 * @returns Whether the mode is active, a `toggle` for the control, and an
 *          `exit` that is a no-op when the video is already in the page
 * @category Hooks
 */
export function useEnlargedVideo(): EnlargedVideo {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const pageOffsetAtEntry = useRef<number | undefined>(undefined);

  const enter = useCallback(() => {
    pageOffsetAtEntry.current = window.scrollY;
    setIsEnlarged(true);
  }, []);

  const exit = useCallback(() => {
    setIsEnlarged(false);
  }, []);

  const toggle = useCallback(() => {
    if (isEnlarged) exit();
    else enter();
  }, [isEnlarged, enter, exit]);

  // The player's own `Escape` handling is not an option: its keyboard
  // shortcuts are suppressed whenever an overlay owns the keyboard, which is
  // exactly when a learner is most likely to want out.
  useEffect(() => {
    if (!isEnlarged) return;

    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") exit();
    };

    document.addEventListener("keydown", exitOnEscape);
    return () => document.removeEventListener("keydown", exitOnEscape);
  }, [isEnlarged, exit]);

  // Runs after the exit has committed, so the page is back in its in-flow
  // layout before it is scrolled. Effects do not run on unmount, which is
  // what keeps a navigation from inheriting this page's offset.
  useEffect(() => {
    if (isEnlarged || pageOffsetAtEntry.current === undefined) return;

    window.scrollTo({ top: pageOffsetAtEntry.current });
    pageOffsetAtEntry.current = undefined;
  }, [isEnlarged]);

  return { isEnlarged, toggle, exit };
}
