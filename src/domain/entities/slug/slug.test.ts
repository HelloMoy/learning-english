import { describe, expect, test } from "vitest";

import { Slug } from "./slug";

describe("Slug", () => {
  describe("GIVEN a string with at least 3 characters", () => {
    test("WHEN parsed THEN it returns the branded slug value", () => {
      // Arrange
      const input = "english-a1-greetings";

      // Act
      const result = Slug.parse(input);

      // Assert
      expect(result).toBe(input);
    });
  });

  describe("GIVEN a string shorter than 3 characters", () => {
    test("WHEN parsed THEN Zod throws a length error", () => {
      // Arrange
      const input = "ab";

      // Act + Assert — the parser is synchronous and throws on failure;
      // there is no separate `Act` block because there is no success value
      // to capture and inspect.
      expect(() => Slug.parse(input)).toThrow();
    });
  });
});
