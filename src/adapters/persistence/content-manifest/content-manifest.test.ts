import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import { parseCourseManifests } from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";
import type { FlattenedCatalog } from "@/adapters/persistence/content-manifest/flatten-course-manifests/flatten-course-manifests";
import { courseManifests } from "@/content/courses";

import { afterEach, describe, expect, test, vi } from "vitest";

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

    test("WHEN loaded THEN every module belongs to a served course", () => {
      const courseIds = new Set(contentCatalog.courses.map((course) => course.id));

      for (const row of contentCatalog.modules) {
        expect(courseIds).toContain(row.courseId);
      }
    });

    test("WHEN loaded THEN every lesson row belongs to a served course", () => {
      const courseIds = new Set(contentCatalog.courses.map((course) => course.id));

      for (const row of contentCatalog.lessonRows) {
        expect(courseIds).toContain(row.courseId);
      }
    });

    test("WHEN loaded THEN lesson ids are unique across the whole catalog", () => {
      const ids = contentCatalog.lessonRows.map((row) => row.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});

/**
 * The one place the withheld course's slug is named. It asserts a content
 * decision — "the Advanced course is not published yet" — rather than
 * implementing one: no module that filters or wires the catalog knows it.
 */
describe("the tracked manifests", () => {
  describe("GIVEN the Advanced Intermediate Course is still being written", () => {
    test("WHEN the manifests are parsed THEN it is the one declaring itself a draft", () => {
      const drafts = parseCourseManifests(courseManifests).filter((course) => course.draft);

      expect(drafts.map((course) => course.slug)).toEqual(["advanced-intermediate-course"]);
    });
  });
});

/**
 * The flag's effect on the shipped catalog. Re-imports the loader with the flag
 * flipped, because `contentCatalog` is a module-scope constant: the environment
 * is read once, when the module is first imported, which is exactly the
 * behaviour a build-time catalog wants.
 */
describe("contentCatalog with drafts hidden", () => {
  async function catalogWithDraftsHidden(): Promise<FlattenedCatalog> {
    vi.resetModules();
    vi.stubEnv("SHOW_DRAFT_COURSES", "0");
    const loaded = await import("@/adapters/persistence/content-manifest/content-manifest");
    return loaded.contentCatalog;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("GIVEN one tracked manifest declares itself a draft", () => {
    test("WHEN the catalog loads THEN the draft course is not served", () => {
      return catalogWithDraftsHidden().then((catalog) => {
        expect(catalog.courses.map((course) => course.slug)).not.toContain(
          "advanced-intermediate-course",
        );
      });
    });

    test("WHEN the catalog loads THEN the published courses are still served", () => {
      return catalogWithDraftsHidden().then((catalog) => {
        expect(catalog.courses.map((course) => course.slug)).toEqual(["basic-course"]);
      });
    });

    test("WHEN the catalog loads THEN the draft course leaves no rows behind", () => {
      return catalogWithDraftsHidden().then((catalog) => {
        const courseIds = new Set<string>(catalog.courses.map((course) => course.id));
        const orphans = [
          ...catalog.modules.map((row) => row.courseId),
          ...catalog.lessonRows.map((row) => row.courseId),
        ].filter((courseId) => !courseIds.has(courseId));

        expect(orphans).toEqual([]);
      });
    });
  });
});
