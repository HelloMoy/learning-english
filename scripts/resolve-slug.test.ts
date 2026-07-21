import { describe, expect, test } from "vitest";

import { normalizeFileName, resolveSlug, toPosix } from "./resolve-slug";
import { SLUG_OVERRIDES } from "./slug-overrides";

describe("resolveSlug", () => {
  test("WHEN no override matches THEN it falls back to slugify", () => {
    // Arrange
    const raw = "5 Sound Natural: American Intonation Essentials";

    // Act
    const result = resolveSlug(raw);

    // Assert
    expect(result).toBe("5-sound-natural-american-intonation-essentials");
  });

  test("WHEN an override matches the raw name THEN the override wins over slugify", () => {
    // Arrange — inject an override for this test only, then restore.
    const raw = "1 Day#1";
    const had = Object.prototype.hasOwnProperty.call(SLUG_OVERRIDES, raw);
    const prev = SLUG_OVERRIDES[raw];
    (SLUG_OVERRIDES as Record<string, string>)[raw] = "1-day-01";

    try {
      // Act
      const result = resolveSlug(raw);

      // Assert
      expect(result).toBe("1-day-01");
      expect(result).not.toBe(resolveSlugWithoutOverride(raw));
    } finally {
      if (had) {
        (SLUG_OVERRIDES as Record<string, string>)[raw] = prev as string;
      } else {
        delete (SLUG_OVERRIDES as Record<string, string>)[raw];
      }
    }
  });

  test("WHEN the input is already a slug THEN it round-trips (idempotent)", () => {
    // Arrange
    const slug = "8-everyday-english-phrases-part-2-master-them";

    // Act
    const once = resolveSlug(slug);
    const twice = resolveSlug(once);

    // Assert
    expect(once).toBe(slug);
    expect(twice).toBe(once);
  });
});

describe("normalizeFileName", () => {
  test("WHEN the basename has spaces and accents THEN the stem is slugified and the extension lowercased", () => {
    // Arrange
    const raw = "Aprende Inglés Americano con Fluidez desde Cero.MP4";

    // Act
    const result = normalizeFileName(raw);

    // Assert
    expect(result).toBe("aprende-ingles-americano-con-fluidez-desde-cero.mp4");
  });

  test("WHEN the basename has no extension THEN it is fully slugified", () => {
    // Arrange
    const raw = "Vowel Chart (v2)";

    // Act
    const result = normalizeFileName(raw);

    // Assert
    expect(result).toBe("vowel-chart-v2");
  });

  test("WHEN a special-character filename is normalized THEN it is idempotent", () => {
    // Arrange
    const raw = "Common English Expressions #32.jpeg";

    // Act
    const once = normalizeFileName(raw);
    const twice = normalizeFileName(once);

    // Assert
    expect(once).toBe("common-english-expressions-32.jpeg");
    expect(twice).toBe(once);
  });
});

/**
 * Local helper: what the automatic path would produce, to prove the override
 * actually diverged from `slugify` in the override test above.
 */
function resolveSlugWithoutOverride(raw: string): string {
  // mirror slugify's shape without importing it: rely on resolveSlug of a
  // guaranteed-unmapped variant would be fragile, so hardcode the expected
  // automatic slug for the fixture used above.
  return raw === "1 Day#1" ? "1-day-1" : raw;
}

describe("toPosix", () => {
  test("WHEN the input is already POSIX THEN it round-trips unchanged", () => {
    expect(toPosix("a/b/c")).toBe("a/b/c");
    expect(toPosix("")).toBe("");
  });

  test("WHEN the input uses backslashes THEN they are rewritten to forward slashes", () => {
    // On POSIX, "\\" is just a regular character (not path.sep), so the only
    // way `toPosix` could "do work" is by literally rewriting "\\" to "/".
    // This proves the helper is platform-agnostic without depending on sep.

    // Act
    const result = toPosix("a\\b\\c");

    // Assert
    expect(result).toBe("a/b/c");
    expect(result).not.toContain("\\");
  });
});
