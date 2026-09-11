import { describe, expect, test } from "vitest";

import { INSTALL_RESULT, INSTALL_STEPS } from "./install-steps";

describe("INSTALL_STEPS", () => {
  describe("GIVEN the flow iOS 26 Safari actually requires", () => {
    test("WHEN read THEN it is the five taps, in order, each on its own surface", () => {
      // Recorded from the real device: the bottom bar has no share glyph, so the
      // flow starts at "···"; the sheet Share opens is collapsed, so View More
      // comes before the list; and it ends on a confirmation screen.
      expect(INSTALL_STEPS).toEqual([
        { messageKey: "stepMore", targetKey: "iosMore", surface: "safari-bar" },
        { messageKey: "stepShare", targetKey: "iosShare", surface: "more-menu" },
        {
          messageKey: "stepViewMore",
          targetKey: "iosViewMore",
          surface: "share-sheet-collapsed",
        },
        {
          messageKey: "stepAddToHomeScreen",
          targetKey: "iosAddToHomeScreen",
          surface: "share-sheet",
        },
        { messageKey: "stepAdd", targetKey: "iosAdd", surface: "confirm-sheet" },
      ]);
    });

    test("WHEN read THEN the sheet is expanded before the list is asked for", () => {
      // The whole point of the fifth tap: a learner sent to scroll a list that
      // is not on their screen is the same failure as one sent to a share glyph
      // their toolbar does not have.
      const surfaces = INSTALL_STEPS.map((step) => step.surface);

      expect(surfaces.indexOf("share-sheet-collapsed")).toBe(surfaces.indexOf("share-sheet") - 1);
    });

    test("WHEN read THEN every step names a distinct surface", () => {
      const surfaces = INSTALL_STEPS.map((step) => step.surface);

      expect(new Set(surfaces).size).toBe(INSTALL_STEPS.length);
    });
  });
});

describe("INSTALL_RESULT", () => {
  describe("GIVEN the taps buy the learner something", () => {
    test("WHEN read THEN it is the home screen, and not one of the taps", () => {
      expect(INSTALL_RESULT).toEqual({ messageKey: "result", surface: "home-screen" });
      expect(INSTALL_STEPS).not.toContainEqual(expect.objectContaining({ surface: "home-screen" }));
    });

    test("WHEN read THEN it names no target, because the learner taps nothing", () => {
      expect(INSTALL_RESULT).not.toHaveProperty("targetKey");
    });
  });
});
