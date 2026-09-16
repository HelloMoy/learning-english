"use client";

import { useSyncExternalStore } from "react";

function subscribe(onFullscreenChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onFullscreenChange);
  return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
}

function getSnapshot(): Element | null {
  // A browser without the Fullscreen API has no such property at all, and the
  // contract here is "the element, or nothing" — never `undefined`.
  return document.fullscreenElement ?? null;
}

/**
 * The server presents nothing.
 *
 * @remarks
 * There is no fullscreen on the server, and the first client render has to agree
 * or React reports a hydration mismatch.
 *
 * @returns `null`
 */
function getServerSnapshot(): Element | null {
  return null;
}

/**
 * The element the browser is presenting fullscreen, if any.
 *
 * @remarks
 * The browser paints only that element and its descendants, so anything fixed to
 * the document — a notification, a dialog portalled to `<body>` — is invisible
 * while a learner watches fullscreen. Surfaces that must reach them there render
 * into this element instead; surfaces that would interrupt wait until it is
 * `null` again.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @example
 * ```tsx
 * const fullscreenElement = useFullscreenElement();
 * return fullscreenElement ? createPortal(notice, fullscreenElement) : notice;
 * ```
 *
 * @returns The presented element, or `null` when nothing is
 */
export function useFullscreenElement(): Element | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
