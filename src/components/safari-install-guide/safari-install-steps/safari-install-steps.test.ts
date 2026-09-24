import { describe, expect, test } from "vitest";

import {
  SAFARI_INSTALL_RESULT,
  SAFARI_INSTALL_STEPS,
  type SafariPlatform,
} from "./safari-install-steps";

const targetsOf = (platform: SafariPlatform) =>
  SAFARI_INSTALL_STEPS[platform].map((step) => step.targetKey);

const surfacesOf = (platform: SafariPlatform) =>
  SAFARI_INSTALL_STEPS[platform].map((step) => step.surface);

describe("SAFARI_INSTALL_STEPS", () => {
  describe("GIVEN an iPad, whose share popover opens collapsed", () => {
    test("WHEN read THEN it is the four taps iPadOS requires, in order", () => {
      expect(targetsOf("ipad")).toEqual([
        "iosShare",
        "iosViewMore",
        "iosAddToHomeScreen",
        "iosAdd",
      ]);
    });

    test("WHEN read THEN the flow starts in the toolbar, not a bottom bar", () => {
      // iPad Safari carries the share glyph in its top toolbar; there is no
      // «···» to send the learner to.
      expect(surfacesOf("ipad")[0]).toBe("toolbar");
    });

    test("WHEN read THEN expanding falls between Share and Add to Home Screen", () => {
      // The popover opens with no list on it at all. Sending the learner to
      // scroll a list their iPad is not showing is the trap this step exists
      // to avoid.
      expect(surfacesOf("ipad")).toEqual([
        "toolbar",
        "share-popover-collapsed",
        "share-popover",
        "confirm",
      ]);
    });
  });

  describe("GIVEN a Mac, whose share popover opens complete", () => {
    test("WHEN read THEN it is the three clicks Safari requires, in order", () => {
      expect(targetsOf("mac")).toEqual(["iosShare", "macAddToDock", "iosAdd"]);
    });

    test("WHEN read THEN no step asks the learner to expand the popover", () => {
      // Inventing a View More step here sends the learner looking for a control
      // their popover does not carry — the mirror of the iPad's mistake.
      expect(targetsOf("mac")).not.toContain("iosViewMore");
      expect(surfacesOf("mac")).not.toContain("share-popover-collapsed");
    });
  });

  describe("GIVEN the taps are the cost and the icon is what they buy", () => {
    test("WHEN read THEN each platform's result names where the icon lands", () => {
      expect(SAFARI_INSTALL_RESULT.ipad.surface).toBe("home-screen");
      expect(SAFARI_INSTALL_RESULT.mac.surface).toBe("dock");
    });

    test("WHEN read THEN the result carries no target to act on", () => {
      // The learner taps nothing there, so counting it would overstate the work.
      expect(SAFARI_INSTALL_RESULT.ipad).not.toHaveProperty("targetKey");
      expect(SAFARI_INSTALL_RESULT.mac).not.toHaveProperty("targetKey");
    });
  });
});
