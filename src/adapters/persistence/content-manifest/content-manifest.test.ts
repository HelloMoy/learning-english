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

    test("WHEN loaded THEN no course is described by the generator's placeholder sentence", () => {
      const placeholders = contentCatalog.courses.filter((course) =>
        course.description.startsWith("Course content generated from"),
      );

      expect(placeholders.map((course) => course.slug)).toEqual([]);
    });
  });
});

type DeclaredVideo = { lessonPath: string; source: string };

function declaredVideos(): DeclaredVideo[] {
  return parseCourseManifests(courseManifests).flatMap((course) =>
    course.modules.flatMap((module) =>
      module.lessons.flatMap((lesson) =>
        lesson.kind === "video"
          ? [{ lessonPath: `${course.slug}/${module.slug}/${lesson.slug}`, source: lesson.source }]
          : [],
      ),
    ),
  );
}

/**
 * A deployment never carries video bytes, so a lesson sourcing a local file
 * would 404 in production while playing fine on a developer's machine.
 */
describe("the tracked manifests' video sources", () => {
  const youtubeEmbed = /^https:\/\/www\.youtube\.com\/embed\/[\w-]{11}$/;

  describe("GIVEN every declared video lesson", () => {
    test("WHEN its source is read THEN it is a YouTube embed URL", () => {
      const notOnYoutube = declaredVideos()
        .filter((video) => !youtubeEmbed.test(video.source))
        .map((video) => video.lessonPath);

      expect(notOnYoutube).toEqual([]);
    });

    test("WHEN sources are compared THEN no two lessons share one video", () => {
      const lessonsBySource = Map.groupBy(declaredVideos(), (video) => video.source);
      const shared = [...lessonsBySource.values()]
        .filter((videos) => videos.length > 1)
        .map((videos) => videos.map((video) => video.lessonPath));

      expect(shared).toEqual([]);
    });
  });
});

/**
 * Asserts a content decision — every course is published — rather than
 * implementing one. The draft filter stays in place, dormant, until its own
 * change removes it; a course declaring itself a draft again fails here.
 */
describe("the tracked manifests", () => {
  describe("GIVEN every course has been published", () => {
    test("WHEN the manifests are parsed THEN none declares itself a draft", () => {
      const drafts = parseCourseManifests(courseManifests).filter((course) => course.draft);

      expect(drafts.map((course) => course.slug)).toEqual([]);
    });
  });
});

/**
 * The flag's effect on the shipped catalog. Re-imports the loader with the flag
 * flipped, because `contentCatalog` is a module-scope constant: the environment
 * is read once, when the module is first imported, which is exactly the
 * behaviour a build-time catalog wants. Hiding drafts is what production does
 * by default, so this is the catalog production serves.
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

  describe("GIVEN no tracked manifest declares itself a draft", () => {
    test("WHEN the catalog loads THEN every course is served", () => {
      return catalogWithDraftsHidden().then((catalog) => {
        expect(catalog.courses.map((course) => course.slug)).toEqual([
          "basic-course",
          "advanced-intermediate-course",
        ]);
      });
    });

    test("WHEN the catalog loads THEN it serves every lesson the manifests declare", () => {
      return catalogWithDraftsHidden().then((catalog) => {
        expect(catalog.lessonRows).toHaveLength(contentCatalog.lessonRows.length);
      });
    });
  });
});
