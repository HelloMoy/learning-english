import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { describe, expect, test } from "vitest";

/**
 * The loader parses the real, tracked manifests at import time. These assertions
 * are therefore about the shipped catalog, not a fixture: if a hand-edit breaks
 * a manifest, importing this module throws and the whole suite fails loudly —
 * which is the behaviour the spec asks for.
 */
describe("contentCatalog", () => {
  describe("GIVEN the tracked course manifests", () => {
    test("WHEN loaded THEN the ladder is ordered by sequence", () => {
      const sequences = contentCatalog.courses.map((course) => course.sequence);

      expect(sequences).toEqual([...sequences].sort((left, right) => left - right));
    });

    test("WHEN loaded THEN every course declares at least one module", () => {
      for (const course of contentCatalog.courses) {
        expect(course.moduleCount).toBeGreaterThan(0);
      }
    });

    test("WHEN loaded THEN each course's lessonCount matches its lesson rows", () => {
      for (const course of contentCatalog.courses) {
        const rows = contentCatalog.lessonRows.filter((row) => row.courseId === course.id);

        expect(rows).toHaveLength(course.lessonCount);
      }
    });

    test("WHEN loaded THEN every lesson row belongs to a declared module", () => {
      const moduleIds = new Set(contentCatalog.modules.map((row) => row.id));

      for (const row of contentCatalog.lessonRows) {
        expect(moduleIds).toContain(row.moduleId);
      }
    });

    test("WHEN loaded THEN every resource row belongs to a declared lesson", () => {
      const lessonIds = new Set(contentCatalog.lessonRows.map((row) => row.id));

      for (const row of contentCatalog.resourceRows) {
        expect(lessonIds).toContain(row.lessonId);
      }
    });

    test("WHEN loaded THEN every notes key belongs to a declared lesson", () => {
      const lessonIds = new Set(contentCatalog.lessonRows.map((row) => row.id));

      for (const lessonId of Object.keys(contentCatalog.notesKeys)) {
        expect(lessonIds).toContain(lessonId);
      }
    });

    test("WHEN loaded THEN lesson ids are unique across the whole catalog", () => {
      const ids = contentCatalog.lessonRows.map((row) => row.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
