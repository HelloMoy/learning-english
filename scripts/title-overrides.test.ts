import { describe, expect, test } from "vitest";

import { LESSON_TITLE_OVERRIDES, lessonTitleOverride } from "./title-overrides";

describe("lessonTitleOverride", () => {
  test("WHEN the key is present THEN it returns the override", () => {
    const [key, value] = Object.entries(LESSON_TITLE_OVERRIDES)[0] as [string, string];
    expect(lessonTitleOverride(key)).toBe(value);
  });

  test("WHEN the key is absent THEN it returns undefined", () => {
    expect(lessonTitleOverride("no-such/module/lesson")).toBeUndefined();
  });
});

describe("LESSON_TITLE_OVERRIDES — table invariants", () => {
  test("WHEN a value contains an apostrophe THEN it is the typographic one", () => {
    // Overrides are hand-written and deliberately NOT normalized, so this
    // test is what keeps the table honest instead of silently repairing it.
    for (const [key, value] of Object.entries(LESSON_TITLE_OVERRIDES)) {
      expect(value, `override for ${key} must use U+2019, not U+0027`).not.toContain("'");
    }
  });

  test("WHEN a key is declared THEN it is a full course/module/lesson path", () => {
    // A bare lesson slug like "1-intro" exists in most modules and would
    // rename all of them at once.
    for (const key of Object.keys(LESSON_TITLE_OVERRIDES)) {
      expect(key.split("/"), `override key "${key}" must have three segments`).toHaveLength(3);
    }
  });

  test("WHEN a value is declared THEN it is non-empty and trimmed", () => {
    for (const [key, value] of Object.entries(LESSON_TITLE_OVERRIDES)) {
      expect(value.length, `override for ${key} must not be empty`).toBeGreaterThan(0);
      expect(value, `override for ${key} must be trimmed`).toBe(value.trim());
    }
  });
});
