"use client";

import { isRunningStandalone } from "@/lib/is-running-standalone/is-running-standalone";

import { useCanInstallToHomeScreen } from "../use-can-install-to-home-screen/use-can-install-to-home-screen";
import { useIsHydrated } from "../use-is-hydrated/use-is-hydrated";

/**
 * The Apple surface a learner is on, as far as installing is concerned.
 *
 * @remarks
 * Three rather than one, because the three need different guides: the taps
 * differ, the surfaces they happen on differ in shape and position, and a Mac
 * ends up with an icon in the Dock rather than on a home screen it does not
 * have.
 *
 * @category Hooks
 */
export type SafariInstallSurface = "iphone" | "ipad" | "mac" | "none";

/**
 * Every Chromium and Gecko browser puts "Safari" in its user agent, so the word
 * alone proves nothing. These are the tokens that give the impostors away.
 */
const NOT_REALLY_SAFARI = /Chrome|Chromium|Edg|OPR|Firefox|CriOS|FxiOS|EdgiOS|OPiOS|GSA/;

/**
 * iPadOS 13+ sends this too. Verified on iPadOS 26.5, where Safari reports a
 * Macintosh user agent with no iPad token anywhere in it.
 */
const APPLE_DESKTOP = /Macintosh/;

const isAppleDesktopSafari = (userAgent: string) =>
  APPLE_DESKTOP.test(userAgent) &&
  userAgent.includes("Safari") &&
  !NOT_REALLY_SAFARI.test(userAgent);

/**
 * The one signal that separates an iPad from the Mac it claims to be. Measured:
 * 0 on macOS 26.6, 5 on iPadOS 26.5.
 */
const hasTouchScreen = () => navigator.maxTouchPoints > 1;

/**
 * Client hook: which Safari install flow, if any, this learner can be shown.
 *
 * @remarks
 * The iPhone answer comes from {@link useCanInstallToHomeScreen}, which already
 * owns that question and has its own spec. What this adds is the pair the user
 * agent cannot separate on its own.
 *
 * iPadOS 13 and later send a Macintosh user agent with no iPad token in it, so
 * an iPad and a Mac are byte-for-byte identical here. `navigator.maxTouchPoints`
 * is what tells them apart, and getting it wrong is not cosmetic: it serves one
 * platform the other's guide, naming controls that are not on the learner's
 * screen — the exact failure these guides exist to prevent.
 *
 * A feature test for touch events would not do. `ontouchstart` is present on
 * plenty of desktop Chromium builds and absent on some touch hardware;
 * `maxTouchPoints` is the signal that actually reads 0 on a Mac and 5 on an
 * iPad. `navigator.userAgentData` would be better still, and Safari does not
 * implement it.
 *
 * Everything it reads is a property of the browser, so it reports `"none"`
 * until hydration commits — rendering anything else during hydration makes the
 * server and client markup disagree — and `"none"` again once the app is
 * running from the home screen, because then the learner has already done it.
 *
 * @example
 * ```tsx
 * const surface = useSafariInstallSurface();
 *
 * if (surface === "none") return null;
 * return <InstallAppButton surface={surface} />;
 * ```
 *
 * @returns The surface to guide, or `"none"`
 * @see useCanInstallToHomeScreen
 * @see isRunningStandalone
 * @category Hooks
 */
export function useSafariInstallSurface(): SafariInstallSurface {
  const isHydrated = useIsHydrated();
  const isIPhoneThatCanInstall = useCanInstallToHomeScreen();

  if (!isHydrated) return "none";
  if (isIPhoneThatCanInstall) return "iphone";
  if (isRunningStandalone()) return "none";
  if (!isAppleDesktopSafari(navigator.userAgent)) return "none";

  return hasTouchScreen() ? "ipad" : "mac";
}
