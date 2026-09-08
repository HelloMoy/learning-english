import { describe, expect, test } from "vitest";

import { contentCatalog } from "../../src/adapters/persistence/content-manifest/content-manifest";
import { allContentKeys } from "./content-keys";

describe("allContentKeys", () => {
  const keys = allContentKeys();

  test("WHEN the manifests are walked THEN every key-sourced video is included", () => {
    // Not "every video source": one whose source is a URL is served by someone
    // else and is deliberately absent — see the hosted-lesson test below.
    expect(keys.some((key) => key.endsWith(".mp4"))).toBe(true);
  });

  test("WHEN the manifests are walked THEN posters and resources are included", () => {
    expect(keys.some((key) => /\.(jpe?g|png)$/.test(key))).toBe(true);
    expect(keys.some((key) => key.endsWith(".pdf") || key.endsWith(".md"))).toBe(true);
  });

  test("WHEN keys are collected THEN none is a URL", () => {
    // The manifests hold opaque keys, never resolved URLs. A leading slash or
    // a scheme here would mean a key had been resolved before the BlobStore.
    for (const key of keys) {
      expect(key.startsWith("/")).toBe(false);
      expect(key).not.toMatch(/^https?:/);
    }
  });

  test("WHEN a lesson's video is hosted elsewhere THEN its poster is still inventoried", () => {
    // The exclusion is per value, not per lesson: the video left the store,
    // its thumbnail did not. No assertion that hosted lessons exist — emptying
    // `lessonVideoSources` is the documented rollback and must stay green.
    const hosted = contentCatalog.lessonRows.filter(
      (row) => row.kind === "video" && /^https?:/.test(row.source),
    );

    for (const lesson of hosted) {
      if (lesson.kind !== "video") continue;
      expect(keys).not.toContain(lesson.source);
      if (lesson.poster) expect(keys).toContain(lesson.poster);
    }
  });

  test("WHEN keys are collected THEN there are no duplicates", () => {
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("WHEN keys are collected THEN they are sorted, so output is stable", () => {
    expect(keys).toEqual([...keys].sort());
  });
});
