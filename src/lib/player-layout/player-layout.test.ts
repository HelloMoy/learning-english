import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { COMPACT_CHROME_MAX_WIDTH, isCompactChrome } from "./player-layout";

describe("isCompactChrome", () => {
  test("WHEN the player is narrower than the threshold THEN the chrome is compact", () => {
    const narrow = faker.number.int({ min: 1, max: COMPACT_CHROME_MAX_WIDTH - 1 });

    expect(isCompactChrome(narrow)).toBe(true);
  });

  test("WHEN the player is exactly at the threshold THEN the chrome is full", () => {
    expect(isCompactChrome(COMPACT_CHROME_MAX_WIDTH)).toBe(false);
  });

  test("WHEN the player is wider than the threshold THEN the chrome is full", () => {
    const wide = faker.number.int({
      min: COMPACT_CHROME_MAX_WIDTH + 1,
      max: COMPACT_CHROME_MAX_WIDTH * 10,
    });

    expect(isCompactChrome(wide)).toBe(false);
  });

  test("WHEN the player has not been measured yet THEN the chrome is compact", () => {
    // Vidstack reports zero until the player is laid out. The answer settles
    // on the first measurement; what matters here is that it is the same
    // answer the layout itself starts from.
    expect(isCompactChrome(0)).toBe(true);
  });
});
