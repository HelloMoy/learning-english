import { routing } from "@/i18n/routing";

import { faker } from "@faker-js/faker";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { requireSupportedLocale } from "./require-supported-locale";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const mockNotFound = vi.mocked(notFound);

beforeEach(() => {
  mockNotFound.mockClear();
});

describe("requireSupportedLocale", () => {
  describe("GIVEN a locale the routing configuration declares", () => {
    test.each(routing.locales)("WHEN the locale is %s THEN it is returned unchanged", (locale) => {
      expect(requireSupportedLocale(locale)).toBe(locale);
      expect(mockNotFound).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a segment that is not a locale", () => {
    test("WHEN a dotted path reaches the route THEN the request is not found", () => {
      // The proxy matcher excludes anything containing a dot, so `/manifest.json`
      // arrives at `[locale]` unvalidated. Without this guard it reaches
      // `shareMetadata`, which throws and litters the server log.
      expect(() => requireSupportedLocale("manifest.json")).toThrow();

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    test("WHEN the locale is unsupported THEN the request is not found", () => {
      expect(() => requireSupportedLocale("xx")).toThrow();

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    test("WHEN the segment is empty THEN the request is not found", () => {
      expect(() => requireSupportedLocale("")).toThrow();

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    test("WHEN an arbitrary segment arrives THEN the request is not found", () => {
      const segment = faker.lorem.slug();

      expect(() => requireSupportedLocale(segment)).toThrow();

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    test("WHEN a locale differs only by case THEN it is still not supported", () => {
      // `routing.locales` is lowercase; accepting `EN` here would hand a
      // mixed-case locale to the canonical URL builder.
      expect(() => requireSupportedLocale("EN")).toThrow();

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });
  });
});
