import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  LEARNER_ILLUSTRATION_IDS,
  LEARNER_NAME_MAX_LENGTH,
  learnerFirstName,
  learnerInitials,
  LearnerProfile,
} from "./learner-profile";

const initialsAvatar = { kind: "initials" } as const;

describe("LearnerProfile", () => {
  describe("GIVEN a name padded with spaces and an illustration avatar", () => {
    test("WHEN parsed THEN the name is trimmed and the avatar kept", () => {
      // Arrange
      const input = { name: "  Ana García ", avatar: { kind: "illustration", id: "wave" } };

      // Act
      const result = LearnerProfile.parse(input);

      // Assert
      expect(result).toEqual({ name: "Ana García", avatar: { kind: "illustration", id: "wave" } });
    });
  });

  describe("GIVEN the initials avatar", () => {
    test("WHEN parsed THEN it is accepted", () => {
      // Arrange
      const input = { name: faker.person.firstName(), avatar: initialsAvatar };

      // Act
      const result = LearnerProfile.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a blank name", () => {
    test("WHEN parsed THEN it is rejected", () => {
      // Arrange
      const input = { name: "   ", avatar: initialsAvatar };

      // Act
      const result = LearnerProfile.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a name longer than the limit", () => {
    test("WHEN parsed THEN it is rejected", () => {
      // Arrange
      const input = { name: "a".repeat(LEARNER_NAME_MAX_LENGTH + 1), avatar: initialsAvatar };

      // Act
      const result = LearnerProfile.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN an illustration that is not in the set", () => {
    test("WHEN parsed THEN it is rejected", () => {
      // Arrange
      const input = { name: "Ana", avatar: { kind: "illustration", id: "dragon" } };

      // Act
      const result = LearnerProfile.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  test("offers exactly the eight shipped illustrations", () => {
    expect(LEARNER_ILLUSTRATION_IDS).toEqual([
      "sun",
      "wave",
      "leaf",
      "plum",
      "ember",
      "echo",
      "night",
      "schwa",
    ]);
  });
});

describe("learnerInitials", () => {
  test("takes the first letter of the first and last words, upper-cased", () => {
    expect(learnerInitials("ana maría garcía")).toBe("AG");
  });

  test("gives one letter for a single word", () => {
    expect(learnerInitials("Ana")).toBe("A");
  });

  test("ignores surrounding and repeated spaces", () => {
    expect(learnerInitials("  ana   lópez ")).toBe("AL");
  });

  test("keeps an accented first letter", () => {
    expect(learnerInitials("élise örn")).toBe("ÉÖ");
  });

  test("falls back to a question mark for a blank name", () => {
    expect(learnerInitials("  ")).toBe("?");
  });
});

describe("learnerFirstName", () => {
  test("returns the first word of the name", () => {
    expect(learnerFirstName("  Ana María García")).toBe("Ana");
  });
});
