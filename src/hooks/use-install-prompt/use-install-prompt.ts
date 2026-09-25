"use client";

import {
  forgetStashedOffer,
  takeStashedOffer,
} from "@/lib/install-offer-stash/install-offer-stash";
import { isRunningStandalone } from "@/lib/is-running-standalone/is-running-standalone";

import { useCallback, useEffect, useState } from "react";

import { useIsHydrated } from "../use-is-hydrated/use-is-hydrated";

/**
 * Chromium's non-standard install offer.
 *
 * @remarks
 * Not in `lib.dom`, because no standard describes it: it is a Chromium
 * extension, and Firefox and WebKit fire nothing of the kind. It is declared
 * here and read here, so the rest of the app never touches a browser API that
 * may not exist.
 *
 * `userChoice` is deliberately absent. The application does not assert whether
 * the install happened — that outcome belongs to a dialog it does not draw —
 * so typing the promise would only invite someone to await it.
 *
 * @category Hooks
 */
export type BeforeInstallPromptEvent = Event & {
  /** Opens the browser's own install dialog. Usable once. */
  prompt: () => Promise<unknown>;
};

/**
 * What the browser is currently offering.
 *
 * @remarks
 * A union rather than a nullable callback: `accept` exists only in the state
 * where there is something to accept, so no caller has to guard against
 * calling it into the void.
 *
 * @category Hooks
 */
export type InstallOffer =
  | { readonly canInstall: false }
  | {
      readonly canInstall: true;
      /** Opens the browser's install dialog. Call it from the learner's gesture. */
      readonly accept: () => void;
    };

const NO_OFFER: InstallOffer = { canInstall: false };

/**
 * Client hook: the browser's standing offer to install this app, if it has one.
 *
 * @remarks
 * Chromium fires `beforeinstallprompt` when it considers a site installable,
 * and a page that prevents the event's default keeps the right to open the
 * install dialog later, from a gesture of the learner's own. That is the whole
 * mechanism, and this hook is the only place in the app that knows about it.
 *
 * Preventing the default is not optional: left alone the browser shows its own
 * promotion, and the learner would be asked twice by two different surfaces.
 *
 * The event usually arrives **before this hook exists**. Chromium fires it as
 * soon as it judges the site installable, which is routinely before hydration,
 * and it does not fire again — so subscribing alone loses it.
 * {@link captureInstallOffer}, run from the client instrumentation entry point
 * before the application starts, catches it first; this hook adopts whatever is
 * waiting there and subscribes as well, so it is right whichever side of
 * hydration the event lands on.
 *
 * The offer is withdrawn on three occasions — the learner accepted it, the
 * browser reported the install, or the app is already running from the home
 * screen — because in all three the question has been settled and asking again
 * would be asking someone to repeat themselves.
 *
 * It reports no offer until hydration commits. The event is a browser fact and
 * cannot be known while rendering on the server, so adopting it earlier would
 * make the server and client markup disagree.
 *
 * Browsers that fire nothing — Firefox, and Safari on every platform — simply
 * never leave the no-offer state. On an iPhone that is the whole reason
 * {@link useCanInstallToHomeScreen} and its guide exist.
 *
 * @example
 * ```tsx
 * const offer = useInstallPrompt();
 *
 * if (!offer.canInstall) return null;
 * return <button onClick={offer.accept}>Install</button>;
 * ```
 *
 * @returns The offer, carrying `accept` only while there is one
 * @see isRunningStandalone
 * @category Hooks
 */
export function useInstallPrompt(): InstallOffer {
  const isHydrated = useIsHydrated();
  const [offer, setOffer] = useState<BeforeInstallPromptEvent | null>(takeStashedOffer);

  useEffect(() => {
    const keep = (event: Event) => {
      event.preventDefault();
      setOffer(event as BeforeInstallPromptEvent);
    };
    const withdraw = () => {
      forgetStashedOffer();
      setOffer(null);
    };

    window.addEventListener("beforeinstallprompt", keep);
    window.addEventListener("appinstalled", withdraw);

    return () => {
      window.removeEventListener("beforeinstallprompt", keep);
      window.removeEventListener("appinstalled", withdraw);
    };
  }, []);

  // The dialog is opened before anything else happens: awaiting even one
  // microtask first spends the learner's gesture, and the browser then refuses
  // the call. Dropping the event afterwards is what stops it being offered a
  // second time, which Chromium would refuse anyway.
  const accept = useCallback(() => {
    void offer?.prompt();
    forgetStashedOffer();
    setOffer(null);
  }, [offer]);

  if (!isHydrated || offer === null || isRunningStandalone()) return NO_OFFER;

  return { canInstall: true, accept };
}
