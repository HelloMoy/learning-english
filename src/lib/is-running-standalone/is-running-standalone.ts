/**
 * Whether the app is already running from the home screen rather than in a
 * browser tab.
 *
 * @remarks
 * Two signals, because neither covers the field on its own. `display-mode:
 * standalone` is the standard one every Chromium browser answers. Safari's own
 * `navigator.standalone` predates that media query and is still the reliable
 * signal on iOS, so both are consulted and either one is enough.
 *
 * This is the definition of "already installed" for the whole app: the install
 * guide and the install prompt both withdraw on it, and they must withdraw on
 * the same evidence, or a learner ends up being offered one of them after
 * having done it.
 *
 * It reads `window` and `navigator`, so it SHALL only be called from the
 * client, and never while rendering on the server.
 *
 * @example
 * ```ts
 * if (isRunningStandalone()) return false;
 * ```
 *
 * @returns `true` when the app was launched from the home screen
 * @category Utilities
 */
export function isRunningStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
