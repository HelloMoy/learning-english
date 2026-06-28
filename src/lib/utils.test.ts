import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  describe("GIVEN two class names", () => {
    test("WHEN merging them THEN the result joins them with a space", () => {
      // Arrange
      const a = faker.lorem.word();
      const b = faker.lorem.word();

      // Act
      const result = cn(a, b);

      // Assert
      expect(result).toBe(`${a} ${b}`);
    });
  });

  describe("GIVEN a class name with falsy values mixed in", () => {
    test("WHEN merging THEN only the truthy class names appear in the result", () => {
      // Arrange
      const word = faker.lorem.word();

      // Act
      const result = cn(word, false, null, undefined, 0, "");

      // Assert
      expect(result).toBe(word);
    });
  });

  describe("GIVEN conflicting Tailwind utilities", () => {
    test("WHEN merging THEN the last one wins", () => {
      // Arrange + Act
      const result = cn("px-2", "px-4");

      // Assert
      expect(result).toBe("px-4");
    });
  });

  describe("GIVEN a base class and a conditional object", () => {
    test("WHEN the active key is true THEN it is appended AND the disabled key is omitted", () => {
      // Arrange
      const activeKey = faker.lorem.word();
      const disabledKey = faker.lorem.word();

      // Act
      const result = cn("base", { [activeKey]: true, [disabledKey]: false });

      // Assert
      expect(result).toBe(`base ${activeKey}`);
    });
  });
});
