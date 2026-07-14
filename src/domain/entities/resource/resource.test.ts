import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { Resource, ResourceKind } from "./resource";

const baseResourceShape = {
  id: faker.string.uuid(),
  lessonId: faker.string.uuid(),
  title: faker.commerce.productName(),
  url: faker.internet.url(),
  kind: "pdf" as const,
};

describe("ResourceKind", () => {
  describe("GIVEN a known kind", () => {
    test.each(["pdf", "slides", "code", "other"] as const)(
      "WHEN parsed as %s THEN it is accepted",
      (kind) => {
        // Act + Assert
        expect(() => ResourceKind.parse(kind)).not.toThrow();
      },
    );
  });

  describe("GIVEN an unknown kind", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Act + Assert
      expect(() => ResourceKind.parse("video")).toThrow();
    });
  });
});

describe("Resource", () => {
  describe("GIVEN a valid resource", () => {
    test("WHEN parsed THEN the typed resource is returned", () => {
      // Arrange
      const input = { ...baseResourceShape };

      // Act
      const result = Resource.parse(input);

      // Assert
      expect(result.title).toBe(input.title);
      expect(result.kind).toBe("pdf");
      expect(result.url).toBe(input.url);
    });
  });

  describe("GIVEN a resource missing required fields", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange — `undefined` removes the field semantically.
      const missing = { ...baseResourceShape, title: undefined };

      // Act + Assert
      expect(() => Resource.parse(missing)).toThrow();
    });
  });

  describe("GIVEN a resource with an invalid URL", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseResourceShape, url: "not-a-url" };

      // Act + Assert
      expect(() => Resource.parse(input)).toThrow();
    });
  });

  describe("GIVEN a resource with an unknown kind", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseResourceShape, kind: "video" as unknown as "pdf" };

      // Act + Assert
      expect(() => Resource.parse(input)).toThrow();
    });
  });

  describe("GIVEN a resource whose id is not a UUID", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseResourceShape, id: "not-a-uuid" };

      // Act + Assert
      expect(() => Resource.parse(input)).toThrow();
    });
  });
});
