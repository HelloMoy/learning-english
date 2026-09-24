"use client";

import { useInstallPrompt } from "../use-install-prompt/use-install-prompt";
import { useSafariInstallSurface } from "../use-safari-install-surface/use-safari-install-surface";

/**
 * The way this browser can get the app onto the learner's home screen, if any.
 *
 * @remarks
 * A union rather than a boolean, because the ways in are not interchangeable:
 * one performs the install, and the other three can only describe it — each on
 * a different device, with different taps on differently shaped surfaces.
 *
 * `accept` rides along on the path that has it, so the header never has to ask
 * a second hook for it and risk holding a different browser offer than the one
 * it is showing.
 *
 * @category Hooks
 */
export type InstallPath =
  | { readonly kind: "none" }
  | { readonly kind: "guide" }
  | { readonly kind: "ipad-guide" }
  | { readonly kind: "mac-guide" }
  | {
      readonly kind: "prompt";
      /** Opens the browser's install dialog. Call it from the learner's gesture. */
      readonly accept: () => void;
    };

/** A path that actually leads somewhere, which is what the header control needs. */
export type AvailableInstallPath = Exclude<InstallPath, { kind: "none" }>;

const NO_PATH: InstallPath = { kind: "none" };

/** One route per Safari surface, because each needs different taps drawn. */
const GUIDE_FOR: Readonly<Record<"iphone" | "ipad" | "mac", InstallPath>> = {
  iphone: { kind: "guide" },
  ipad: { kind: "ipad-guide" },
  mac: { kind: "mac-guide" },
} as const;

/**
 * Client hook: which install route this browser offers, and what it needs to
 * take it.
 *
 * @remarks
 * Composed from the two signals rather than merged into one, because they rest
 * on different evidence. {@link useSafariInstallSurface} reads a user agent and
 * a touch-point count, which is all Apple gives anyone. {@link useInstallPrompt}
 * waits for an event the browser actually fired. Folding them into a single
 * predicate would hide that one of them is a guess and the other is a fact.
 *
 * The three Safari surfaces are three routes rather than one, because the taps
 * differ and so do the surfaces they happen on: an iPad guide shown to a Mac
 * would name controls the learner does not have.
 *
 * The prompt wins where both hold. Performing the install beats describing it,
 * and although they cannot overlap today — Safari fires no such event — writing
 * the precedence down means a WebKit that starts firing one does the better
 * thing without another change here.
 *
 * Both sources report nothing until hydration commits, so this does too.
 *
 * @example
 * ```tsx
 * const path = useInstallPath();
 *
 * if (path.kind === "none") return null;
 * return <InstallAppButton path={path} />;
 * ```
 *
 * @returns The route to offer, carrying the browser's offer where there is one
 * @see useInstallPrompt
 * @see useSafariInstallSurface
 * @category Hooks
 */
export function useInstallPath(): InstallPath {
  const offer = useInstallPrompt();
  const safariSurface = useSafariInstallSurface();

  if (offer.canInstall) return { kind: "prompt", accept: offer.accept };
  if (safariSurface === "none") return NO_PATH;

  return GUIDE_FOR[safariSurface];
}
