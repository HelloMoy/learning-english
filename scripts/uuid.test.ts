import { describe, expect, test } from "vitest";

import { uuidv5 } from "./uuid";

describe("uuidv5", () => {
  test("WHEN called with the same name THEN it returns the same UUID (deterministic)", () => {
    // Arrange
    const name = "advanced-intermediate-pronunciation";

    // Act
    const a = uuidv5(name);
    const b = uuidv5(name);

    // Assert
    expect(a).toBe(b);
  });

  test("WHEN called with different names THEN it returns different UUIDs", () => {
    // Arrange
    const nameA = "advanced-intermediate-pronunciation";
    const nameB = "beginner-pronunciation";

    // Act
    const a = uuidv5(nameA);
    const b = uuidv5(nameB);

    // Assert
    expect(a).not.toBe(b);
  });

  test("WHEN the output is checked THEN it matches UUID format (8-4-4-4-12 hex with version 5)", () => {
    // Act
    const id = uuidv5("anything");

    // Assert — UUID v4/v5 format check.
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
