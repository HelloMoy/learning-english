import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { shareHeadline } from "./share-headline";

/**
 * Guards the `site-metadata` capability's "a course card leads with what the
 * course teaches" scenario.
 *
 * The openings are hardcoded because the cut points are what is under test;
 * the tails are faker, because their content is irrelevant to where the cut
 * falls.
 */
describe("shareHeadline", () => {
  test("cuts at the first colon, which is where a description stops promising and starts listing", () => {
    const headline = shareHeadline(
      `American pronunciation from the ground up: ${faker.lorem.sentence()}`,
    );

    expect(headline).toBe("American pronunciation from the ground up");
  });

  test("cuts at the first sentence end when there is no colon", () => {
    const headline = shareHeadline(`Speak with a clearer accent. ${faker.lorem.sentence()}`);

    expect(headline).toBe("Speak with a clearer accent");
  });

  test("prefers the colon when a description has both", () => {
    const headline = shareHeadline("Rhythm and stress: drills, pairs. And more.");

    expect(headline).toBe("Rhythm and stress");
  });

  test("returns the whole description when it has neither", () => {
    const headline = shareHeadline("  Contractions and reductions  ");

    expect(headline).toBe("Contractions and reductions");
  });

  test("never returns empty for a description that has content", () => {
    for (const description of [": leading colon", ". leading stop", "x", "a: b"]) {
      expect(shareHeadline(description).length).toBeGreaterThan(0);
    }
  });

  test("leaves a decimal point alone rather than cutting a number in half", () => {
    const headline = shareHeadline("Covers all 44.5 hours of drills. Then the practice track.");

    expect(headline).toBe("Covers all 44.5 hours of drills");
  });
});
