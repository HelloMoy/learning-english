import { describe, expect, it } from "vitest";

import en from "./en.json";
import es from "./es.json";
import pt from "./pt.json";

const CATALOGUES = { en, es, pt } as const;

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("story message catalogues", () => {
  it.each(["es", "pt"] as const)("%s carries exactly the keys en does", (locale) => {
    expect(keyPaths(CATALOGUES[locale]).sort()).toEqual(keyPaths(CATALOGUES.en).sort());
  });
});
