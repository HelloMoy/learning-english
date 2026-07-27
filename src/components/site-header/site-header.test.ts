import { describe, expect, test } from "vitest";

import { sectionKey } from "./site-header";

describe("sectionKey (header section derivation)", () => {
  test.each([
    ["/", "sectionHome"],
    ["/courses/advanced-intermediate-course", "sectionCourse"],
    ["/courses/c/modules/3-contractions-reductions", "sectionModule"],
    ["/courses/c/modules/m/lessons/841a0a7b", "sectionLesson"],
  ])("derives %s → %s", (path, expected) => {
    expect(sectionKey(path)).toBe(expected);
  });
});
