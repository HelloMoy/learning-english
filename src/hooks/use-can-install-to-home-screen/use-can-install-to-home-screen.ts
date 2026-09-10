"use client";

import { useIsHydrated } from "../use-is-hydrated/use-is-hydrated";

/**
 * iPhone only. iPadOS 13+ reports a Mac user agent, and the guide's mock screen
 * is a phone, so widening this would show an iPad a picture of a device it is
 * not.
 */
const IPHONE = /iPhone|iPod/;

/**
 * Every iOS browser puts "Safari" in its user agent, because they are all
 * WebKit. Only the real Safari lacks one of these vendor tokens, and only the
 * real Safari has the Share → Add to Home Screen flow this guide teaches.
 */
const OTHER_IOS_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/;

const isIPhoneSafari = (userAgent: string) =>
  IPHONE.test(userAgent) && !OTHER_IOS_BROWSERS.test(userAgent);

/**
 * True once the app is already running from the home screen. Safari's own
 * `navigator.standalone` predates the standard media query and is still the
 * reliable signal on iOS, so both are consulted.
 */
const isAlreadyInstalled = () =>
  window.matchMedia?.("(display-mode: standalone)").matches === true ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Client hook: whether this learner can still add the app to their home screen.
 *
 * @remarks
 * True only for Safari on an iPhone where the app is not already running
 * standalone. Everything it reads is a property of the browser, so it reports
 * `false` until hydration commits — rendering anything else during hydration
 * makes the server and client markup disagree.
 *
 * The three conditions are each load-bearing. Other iOS browsers are WebKit but
 * have no Share → Add to Home Screen flow. A desktop browser has the concept but
 * not the steps this guide depicts. And someone already launching from the home
 * screen has done it, so offering the guide would be telling them to repeat
 * themselves.
 *
 * There is no capability to feature-detect here: iOS exposes no API for adding
 * to the home screen, which is the entire reason a guide exists rather than a
 * button. User-agent sniffing is the only signal available.
 *
 * @example
 * ```tsx
 * const canInstall = useCanInstallToHomeScreen();
 *
 * if (!canInstall) return null;
 * return <InstallAppButton />;
 * ```
 *
 * @returns `false` until hydration commits, then whether the flow is available
 * @see useIsHydrated
 */
export function useCanInstallToHomeScreen(): boolean {
  const isHydrated = useIsHydrated();

  if (!isHydrated) return false;

  return isIPhoneSafari(navigator.userAgent) && !isAlreadyInstalled();
}
