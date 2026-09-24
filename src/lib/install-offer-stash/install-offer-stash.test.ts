import { afterEach, describe, expect, test, vi } from "vitest";

import { captureInstallOffer, forgetStashedOffer, takeStashedOffer } from "./install-offer-stash";

const anOffer = () =>
  Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
  });

describe("the install-offer stash", () => {
  afterEach(() => {
    forgetStashedOffer();
  });

  describe("GIVEN Chromium fires its offer before the app exists", () => {
    test("WHEN it fires after capture started THEN the offer is waiting", () => {
      // Measured on Android Chrome 149: without this the event lands before
      // hydration, is never replayed, and the prompt never appears at all.
      captureInstallOffer();

      window.dispatchEvent(anOffer());

      expect(takeStashedOffer()).not.toBeNull();
    });

    test("WHEN it fires THEN the browser's own banner is suppressed", () => {
      captureInstallOffer();
      const offer = anOffer();

      window.dispatchEvent(offer);

      expect(offer.defaultPrevented).toBe(true);
    });
  });

  describe("GIVEN nothing has been offered", () => {
    test("WHEN read THEN there is nothing waiting", () => {
      captureInstallOffer();

      expect(takeStashedOffer()).toBeNull();
    });
  });

  describe("GIVEN an offer has been spent", () => {
    test("WHEN forgotten THEN it is not handed out again", () => {
      captureInstallOffer();
      window.dispatchEvent(anOffer());

      forgetStashedOffer();

      expect(takeStashedOffer()).toBeNull();
    });
  });
});
