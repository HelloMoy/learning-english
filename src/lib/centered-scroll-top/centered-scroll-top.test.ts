import { describe, expect, test } from "vitest";

import { centeredScrollTop } from "./centered-scroll-top";

const ROW_HEIGHT = 40;
const REGION_HEIGHT = 600;
const MAX_SCROLL_TOP = 2000;

describe("centeredScrollTop", () => {
  describe("GIVEN a row with room above and below it", () => {
    test("WHEN it is centred THEN the offset puts the row's middle at the region's middle", () => {
      const scrollTop = centeredScrollTop({
        rowOffsetTop: 1000,
        rowHeight: ROW_HEIGHT,
        regionHeight: REGION_HEIGHT,
        maxScrollTop: MAX_SCROLL_TOP,
      });

      expect(scrollTop).toBe(720);
    });
  });

  describe("GIVEN a row too close to the top to be centred", () => {
    test("WHEN centring would scroll past the start THEN the offset clamps to 0", () => {
      const scrollTop = centeredScrollTop({
        rowOffsetTop: 10,
        rowHeight: ROW_HEIGHT,
        regionHeight: REGION_HEIGHT,
        maxScrollTop: MAX_SCROLL_TOP,
      });

      expect(scrollTop).toBe(0);
    });
  });

  describe("GIVEN a row too close to the bottom to be centred", () => {
    test("WHEN centring would scroll past the end THEN the offset clamps to the maximum", () => {
      const scrollTop = centeredScrollTop({
        rowOffsetTop: 2400,
        rowHeight: ROW_HEIGHT,
        regionHeight: REGION_HEIGHT,
        maxScrollTop: MAX_SCROLL_TOP,
      });

      expect(scrollTop).toBe(MAX_SCROLL_TOP);
    });
  });

  describe("GIVEN a row taller than the region", () => {
    test("WHEN it cannot fit THEN the offset stays within the scrollable range", () => {
      const scrollTop = centeredScrollTop({
        rowOffsetTop: 1000,
        rowHeight: 800,
        regionHeight: REGION_HEIGHT,
        maxScrollTop: MAX_SCROLL_TOP,
      });

      expect(scrollTop).toBeGreaterThanOrEqual(0);
      expect(scrollTop).toBeLessThanOrEqual(MAX_SCROLL_TOP);
    });
  });

  describe("GIVEN a region taller than its own content", () => {
    test("WHEN there is nothing to scroll THEN the offset is 0", () => {
      const scrollTop = centeredScrollTop({
        rowOffsetTop: 120,
        rowHeight: ROW_HEIGHT,
        regionHeight: REGION_HEIGHT,
        maxScrollTop: 0,
      });

      expect(scrollTop).toBe(0);
    });

    test("WHEN the measured maximum is negative THEN the offset is still 0", () => {
      const scrollTop = centeredScrollTop({
        rowOffsetTop: 120,
        rowHeight: ROW_HEIGHT,
        regionHeight: REGION_HEIGHT,
        maxScrollTop: -50,
      });

      expect(scrollTop).toBe(0);
    });
  });
});
