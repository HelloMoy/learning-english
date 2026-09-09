"use client";

import { useCallback, useEffect, useState } from "react";

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
 * and the page's scroll lock.
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
 * The page's previous `overflow` is captured and restored rather than cleared,
 * so a surface that suppresses its own scrolling gets its own value back. The
 * restore also runs on unmount, so navigating away mid-mode cannot leave the
 * next page frozen.
 *
 * @returns Whether the mode is active, a `toggle` for the control, and an
 *          `exit` that is a no-op when the video is already in the page
 * @category Hooks
 */
export function useEnlargedVideo(): EnlargedVideo {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const toggle = useCallback(() => {
    setIsEnlarged((enlarged) => !enlarged);
  }, []);

  const exit = useCallback(() => {
    setIsEnlarged(false);
  }, []);

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

  // The page is captured rather than reset, so a surface that suppresses its
  // own scrolling gets that back instead of the browser default.
  useEffect(() => {
    if (!isEnlarged) return;

    const pageOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = pageOverflow;
    };
  }, [isEnlarged]);

  return { isEnlarged, toggle, exit };
}
