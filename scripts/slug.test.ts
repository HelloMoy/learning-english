import { describe, expect, test } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  test("WHEN the input is already kebab-case ASCII THEN it round-trips", () => {
    // Arrange
    const input = "advanced-pronunciation";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("advanced-pronunciation");
  });

  test("WHEN the input contains `&` THEN it is replaced with `-`", () => {
    // Arrange
    const input = "Contractions & Reductions";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("contractions-reductions");
  });

  test("WHEN the input contains `#` THEN the `#` and surrounding space are removed", () => {
    // Arrange
    const input = "Day#7";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("day-7");
  });

  test("WHEN the input contains accents THEN they are transliterated to ASCII", () => {
    // Arrange
    const input = "Mañana";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("manana");
  });

  test("WHEN the input contains a `:` THEN it is replaced with `-`", () => {
    // Arrange
    const input = "Sound Natural: American Intonation";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("sound-natural-american-intonation");
  });

  test("WHEN the input normalizes to an empty string THEN it falls back to `untitled`", () => {
    // Arrange
    const input = "###";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("untitled");
  });

  test("WHEN the input has leading and trailing whitespace THEN they are trimmed", () => {
    // Arrange
    const input = "  Intro  ";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("intro");
  });

  test("WHEN the input has multiple consecutive separators THEN they collapse to a single `-`", () => {
    // Arrange
    const input = "a & & b";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("a-b");
  });

  test("slugify is idempotent: applying it twice yields the same result as applying it once", () => {
    // Arrange
    const inputs = [
      "Advanced Pronunciation Course",
      "Contractions & Reductions",
      "5 Sound Natural: American Intonation Essentials",
      "Day#7",
      "Rise - Fall Intonation",
    ];

    // Act + Assert
    for (const input of inputs) {
      const once = slugify(input);
      const twice = slugify(once);
      expect(twice).toBe(once);
    }
  });
});
