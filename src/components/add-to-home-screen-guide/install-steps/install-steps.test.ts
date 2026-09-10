import { describe, expect, test } from "vitest";

import { INSTALL_RESULT, INSTALL_STEPS } from "./install-steps";

describe("INSTALL_STEPS", () => {
  describe("GIVEN the flow iOS 26 Safari actually requires", () => {
    test("WHEN read THEN it is the four taps, in order, each on its own surface", () => {
      // Recorded from the real device: the bottom bar has no share glyph, so the
      // flow starts at "···" and ends on a confirmation screen.
      expect(INSTALL_STEPS).toEqual([
        { messageKey: "stepMore", targetKey: "iosMore", surface: "safari-bar" },
        { messageKey: "stepShare", targetKey: "iosShare", surface: "more-menu" },
        {
          messageKey: "stepAddToHomeScreen",
          targetKey: "iosAddToHomeScreen",
          surface: "share-sheet",
        },
        { messageKey: "stepAdd", targetKey: "iosAdd", surface: "confirm-sheet" },
      ]);
    });

    test("WHEN read THEN every step names a distinct surface", () => {
      const surfaces = INSTALL_STEPS.map((step) => step.surface);

      expect(new Set(surfaces).size).toBe(INSTALL_STEPS.length);
    });
  });
});

describe("INSTALL_RESULT", () => {
  describe("GIVEN the four taps buy the learner something", () => {
    test("WHEN read THEN it is the home screen, and not one of the taps", () => {
      expect(INSTALL_RESULT).toEqual({ messageKey: "result", surface: "home-screen" });
      expect(INSTALL_STEPS).not.toContainEqual(expect.objectContaining({ surface: "home-screen" }));
    });

    test("WHEN read THEN it names no target, because the learner taps nothing", () => {
      expect(INSTALL_RESULT).not.toHaveProperty("targetKey");
    });
  });
});
