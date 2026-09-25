import type { BeforeInstallPromptEvent } from "@/hooks/use-install-prompt/use-install-prompt";

/**
 * Where an offer that arrived before the app did is kept.
 *
 * @remarks
 * A property name rather than a module-level variable because the capture runs
 * from the client instrumentation entry point and the read happens inside a
 * React hook; the two are separate bundles, and a global is the one thing they
 * both reach.
 */
const STASH = "__installOffer";

type WindowWithStash = Window & { [STASH]?: BeforeInstallPromptEvent | null };

/**
 * Start listening for the browser's install offer.
 *
 * @remarks
 * Chromium fires `beforeinstallprompt` as soon as it judges the site
 * installable, and it never fires it again. That is routinely **before** React
 * has hydrated, so a listener added from a component effect misses it: measured
 * on Android Chrome 149, with the manifest valid, every icon served and the
 * service worker registered, the install prompt never appeared at all.
 *
 * Called from `instrumentation-client`, which Next runs before the application
 * starts — the earliest hook the framework offers. Several earlier attempts are
 * worth not repeating: an inline `<script>` and a `<script src>` rendered from
 * the root layout both reached only Next's streamed payload and never executed,
 * and `next/script` with `beforeInteractive` is documented for external `src`
 * scripts and emitted nothing for inline content.
 *
 * Preventing the default is not optional: left alone the browser shows its own
 * promotion alongside ours, and the learner is asked twice by two surfaces.
 *
 * @example
 * ```ts
 * // src/instrumentation-client.ts
 * captureInstallOffer();
 * ```
 *
 * @see useInstallPrompt
 * @category Utilities
 */
export function captureInstallOffer(): void {
  (window as WindowWithStash)[STASH] = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    (window as WindowWithStash)[STASH] = event as BeforeInstallPromptEvent;
  });
}

/**
 * The offer captured before hydration, if one is waiting.
 *
 * @remarks
 * Safe to call where there is no browser. `useInstallPrompt` reads it as a
 * lazy state initializer, which React also runs while rendering on the server;
 * nothing can have been captured there, so the answer is `null` rather than a
 * `ReferenceError` that fails every page carrying the site header.
 *
 * @returns The stashed offer, or `null`
 * @category Utilities
 */
export function takeStashedOffer(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;

  return (window as WindowWithStash)[STASH] ?? null;
}

/**
 * Drop the stashed offer, once it has been spent or withdrawn.
 *
 * @remarks
 * Without this a spent offer would be re-adopted by the next mount, and the
 * prompt would return with an event the browser has already refused.
 *
 * @category Utilities
 */
export function forgetStashedOffer(): void {
  (window as WindowWithStash)[STASH] = null;
}
