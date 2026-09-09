"use client";

import { useSyncExternalStore } from "react";

const LANDSCAPE = "(orientation: landscape)";
const COARSE_POINTER = "(pointer: coarse)";

/**
 * Every event after which the layout viewport may have changed height:
 * a rotation, a window resize, and — on iOS — the browser toolbar animating
 * in or out, which reaches the page as a `visualViewport` resize.
 */
function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("resize", onStoreChange);
  window.addEventListener("orientationchange", onStoreChange);
  window.visualViewport?.addEventListener("resize", onStoreChange);
  return () => {
    window.removeEventListener("resize", onStoreChange);
    window.removeEventListener("orientationchange", onStoreChange);
    window.visualViewport?.removeEventListener("resize", onStoreChange);
  };
}

function isDrivenByTouch(): boolean {
  return window.matchMedia(COARSE_POINTER).matches;
}

function isHeldInLandscape(): boolean {
  return window.matchMedia(LANDSCAPE).matches;
}

// iOS reports `screen` in portrait terms whatever the orientation; other
// engines swap the two with it. The short side is the landscape height either
// way.
function screenShortSide(): number {
  return Math.min(window.screen.width, window.screen.height);
}

function getSnapshot(): boolean {
  return isDrivenByTouch() && isHeldInLandscape() && window.innerHeight < screenShortSide();
}

const getServerSnapshot = (): boolean => false;

/**
 * Client hook: reports whether the browser's own chrome — Safari's toolbar on
 * an iPhone — is still taking part of the screen while the device is held in
 * landscape.
 *
 * @remarks
 * There is no API for this, so it is an inference from what the page can
 * measure. On a touch device in landscape the screen's short side is the
 * height the page would have with no browser chrome at all; while the
 * viewport is shorter than that, the chrome is on screen. Measured on iOS
 * 26.5: 292 of 402 points with Safari's toolbar up, all 402 once a swipe has
 * hidden it. `innerHeight` is used because it follows the toolbar (`100dvh`
 * does too; `100lvh` does not).
 *
 * A coarse primary pointer — a finger — is required because the only way to
 * hide that chrome is a real scroll gesture, so the answer is meaningless, and
 * the hint built on it would be nonsense, on a device driven by a mouse.
 * `(pointer: coarse)` is read rather than `navigator.maxTouchPoints` because
 * it is the signal browsers emulate consistently under touch emulation
 * (WebKit and Firefox leave `maxTouchPoints` at 0). Portrait is excluded
 * because a 16:9 video is letterboxed there regardless of the toolbar.
 *
 * It re-evaluates on `resize`, `orientationchange` and `visualViewport`
 * resizes, and reports `false` on the server so hydration matches.
 *
 * @example
 * ```tsx
 * const isChromeVisible = useBrowserChromeVisible();
 * return isEnlarged && isChromeVisible ? <SwipeUpHint /> : null;
 * ```
 *
 * @returns `true` while a touch device in landscape has a viewport shorter than
 *          the screen's short side; `false` otherwise, and always on the server
 * @category Hooks
 */
export function useBrowserChromeVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
