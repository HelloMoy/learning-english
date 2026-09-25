"use client";

import { useEffect } from "react";

/** Served from `public/`, so it is scoped to the whole origin. */
const WORKER_URL = "/sw.js";

/**
 * Client hook: registers the app's service worker, once, after mount.
 *
 * @remarks
 * The worker exists for one reason, and it is not offline support: Chromium
 * will not fire `beforeinstallprompt` for a site whose service worker has no
 * `fetch` handler, so without one the install prompt can never be offered. The
 * worker itself caches nothing — see `public/sw.js`.
 *
 * Nothing waits for it. The registration is started and the promise is dropped,
 * because no part of the app behaves differently before or after it resolves.
 *
 * A browser with no service worker support, or one that refuses the
 * registration — a private window, a blocked origin, a user who turned it off —
 * leaves the app exactly as it is without one: the install prompt is never
 * offered, and everything else works. That is a supported state, not an error,
 * which is why the rejection is swallowed rather than surfaced.
 *
 * @example
 * ```tsx
 * useServiceWorkerRegistration();
 * ```
 *
 * @see useInstallPrompt
 * @category Hooks
 */
export function useServiceWorkerRegistration(): void {
  useEffect(() => {
    void navigator.serviceWorker?.register(WORKER_URL).catch(() => {});
  }, []);
}
