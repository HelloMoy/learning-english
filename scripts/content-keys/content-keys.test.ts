import { describe, expect, test } from "vitest";

import { allContentKeys } from "./content-keys";

describe("allContentKeys", () => {
  const keys = allContentKeys();

  test("WHEN the seed is walked THEN every video source is included", () => {
    expect(keys.some((key) => key.endsWith(".mp4"))).toBe(true);
  });

  test("WHEN the seed is walked THEN posters and resources are included", () => {
    expect(keys.some((key) => /\.(jpe?g|png)$/.test(key))).toBe(true);
    expect(keys.some((key) => key.endsWith(".pdf") || key.endsWith(".md"))).toBe(true);
  });

  test("WHEN keys are collected THEN none is a URL", () => {
    // The seed holds opaque keys, never resolved URLs. A leading slash or a
    // scheme here would mean the seed had been resolved at generation time.
    for (const key of keys) {
      expect(key.startsWith("/")).toBe(false);
      expect(key).not.toMatch(/^https?:/);
    }
  });

  test("WHEN keys are collected THEN there are no duplicates", () => {
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("WHEN keys are collected THEN they are sorted, so output is stable", () => {
    expect(keys).toEqual([...keys].sort());
  });
});
