import { readFileSync } from "node:fs";
import path from "node:path";

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
          "atlas-of-american-sounds",
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

/**
 * The Atlas of American Sounds' content contract (`atlas-of-american-sounds`
 * spec): a reference course in twelve sound-family modules, every poster stored
 * locally beside its lesson.
 */
describe("the Atlas of American Sounds manifest", () => {
  const ATLAS_SLUG = "atlas-of-american-sounds";
  const MODULE_LESSON_COUNTS = [
    ["1-the-vowel-map", 2],
    ["2-front-vowels", 10],
    ["3-central-vowels", 4],
    ["4-back-vowels", 5],
    ["5-diphthongs", 3],
    ["6-r-colored-vowels", 9],
    ["7-stop-consonants", 9],
    ["8-fricatives", 9],
    ["9-affricates", 2],
    ["10-nasals", 4],
    ["11-liquids", 4],
    ["12-glides", 2],
  ];

  const declared = parseCourseManifests(courseManifests);
  const atlas = () => declared.find((course) => course.slug === ATLAS_SLUG);
  const atlasLessons = () => atlas()?.modules.flatMap((module) => module.lessons) ?? [];
  const lessonTitlesOf = (moduleSlug: string) =>
    atlas()
      ?.modules.find((module) => module.slug === moduleSlug)
      ?.lessons.map((lesson) => lesson.title) ?? [];

  describe("GIVEN the tracked manifests", () => {
    test("WHEN parsed THEN the Atlas is declared as a reference course", () => {
      expect(atlas()).toMatchObject({ title: "Atlas of American Sounds", track: "reference" });
    });

    test("WHEN parsed THEN the Atlas follows every level course", () => {
      const levelSequences = declared
        .filter((course) => course.track === "level")
        .map((course) => course.sequence);

      expect(atlas()?.sequence).toBeGreaterThan(Math.max(...levelSequences));
    });

    test("WHEN its description is read THEN it credits Sounds American", () => {
      expect(atlas()?.description).toContain("Sounds American");
    });

    test("WHEN its modules are listed THEN they are the twelve sound families in order", () => {
      const counts = atlas()?.modules.map((module) => [module.slug, module.lessons.length]);

      expect(counts).toEqual(MODULE_LESSON_COUNTS);
    });

    test("WHEN its module slugs are compared THEN no other course shares one", () => {
      const otherSlugs = new Set(
        declared
          .filter((course) => course.slug !== ATLAS_SLUG)
          .flatMap((course) => course.modules.map((module) => module.slug)),
      );
      const shared = (atlas()?.modules ?? []).filter((module) => otherSlugs.has(module.slug));

      expect(shared.map((module) => module.slug)).toEqual([]);
    });

    test("WHEN its posters are read THEN each is the lesson's own local thumbnail", () => {
      const misplaced = (atlas()?.modules ?? []).flatMap((module) =>
        module.lessons
          .filter(
            (lesson) =>
              lesson.kind !== "video" ||
              lesson.poster !== `${ATLAS_SLUG}/${module.slug}/${lesson.slug}/thumbnail.jpeg`,
          )
          .map((lesson) => `${module.slug}/${lesson.slug}`),
      );

      expect(atlasLessons()).toHaveLength(63);
      expect(misplaced).toEqual([]);
    });

    test("WHEN Front Vowels is listed THEN each contrast follows both of its sounds", () => {
      const titles = lessonTitlesOf("2-front-vowels");

      expect(titles.indexOf("Sheep or Ship? /i/ vs /ɪ/")).toBeGreaterThan(
        Math.max(titles.indexOf("/i/ as in “be”"), titles.indexOf("/ɪ/ as in “it”")),
      );
    });

    test("WHEN Stop Consonants is listed THEN its overview opens the module AND /p/ follows", () => {
      const [first, second] = lessonTitlesOf("7-stop-consonants");

      expect([first, second]).toEqual(["Stop Consonants Overview", "/p/ as in “pie”"]);
    });

    test("WHEN the /æ/ lesson is read THEN it names its sound AND plays its own video", () => {
      const cat = atlas()
        ?.modules.find((module) => module.slug === "2-front-vowels")
        ?.lessons.find((lesson) => lesson.slug === "5-ae-as-in-cat");

      expect(cat).toMatchObject({
        title: "/æ/ as in “cat”",
        source: "https://www.youtube.com/embed/mynucZiy-Ug",
        durationSeconds: 324,
      });
    });

    test("WHEN the vowel chart's notes are read THEN every language warns the chart no longer clicks", () => {
      const notes = readFileSync(
        path.join(
          process.cwd(),
          "public/local-filesystem-lesson",
          ATLAS_SLUG,
          "1-the-vowel-map/1-the-vowel-chart/readme.md",
        ),
        "utf8",
      );

      expect(notes).toContain("ya no es interactivo");
      expect(notes).toContain("no longer interactive");
      expect(notes).toContain("não é mais interativo");
    });

    test("WHEN its lesson descriptions are read THEN none is the notes-card placeholder", () => {
      const placeholders = atlasLessons().filter(
        (lesson) => lesson.kind === "video" && lesson.description.includes("Resource below"),
      );

      expect(placeholders.map((lesson) => lesson.slug)).toEqual([]);
    });
  });
});

describe("what the tracked courses teach", () => {
  const declared = parseCourseManifests(courseManifests);
  const courseOf = (slug: string) => declared.find((course) => course.slug === slug);
  const soundsOf = (slug: string) => {
    const sounds = courseOf(slug)?.sounds;
    return [...(sounds?.vowels ?? []), ...(sounds?.consonants ?? [])];
  };
  // A lesson names its sound between slashes: "/æ/ as in “cat”".
  const symbolsNamedIn = (slug: string) =>
    (courseOf(slug)?.modules ?? [])
      .flatMap((module) => module.lessons)
      .flatMap((lesson) => [...lesson.title.matchAll(/\/([^/\s]+)\//g)].map((match) => match[1]));

  describe("GIVEN the tracked manifests", () => {
    test("WHEN parsed THEN every course declares between four and six outcomes", () => {
      // Arrange
      const outcomeCounts = declared.map((course) => course.outcomes?.length ?? 0);

      // Act
      const outOfRange = outcomeCounts.filter((count) => count < 4 || count > 6);

      // Assert
      expect(outOfRange).toEqual([]);
    });

    test("WHEN the Basic Course is parsed THEN it teaches 15 vowels AND 26 consonants", () => {
      // Arrange
      const basic = courseOf("basic-course");

      // Act
      const sounds = basic?.sounds;

      // Assert
      expect(sounds?.vowels).toHaveLength(15);
      expect(sounds?.consonants).toHaveLength(26);
    });

    test("WHEN the Atlas is parsed THEN every sound its lesson titles name is declared", () => {
      // Arrange
      const named = symbolsNamedIn("atlas-of-american-sounds");

      // Act
      const declaredSounds = soundsOf("atlas-of-american-sounds");

      // Assert
      expect(declaredSounds).toEqual(expect.arrayContaining(named));
    });

    test("WHEN any course's sounds are listed THEN none is declared twice", () => {
      // Arrange
      const soundLists = declared.map((course) => soundsOf(course.slug));

      // Act
      const duplicated = soundLists.filter((sounds) => new Set(sounds).size !== sounds.length);

      // Assert
      expect(duplicated).toEqual([]);
    });

    test.each(["es", "pt"])(
      "WHEN parsed THEN every course translates its description AND each outcome into %s",
      (locale) => {
        // Arrange
        const courses = declared;

        // Act
        const untranslated = courses.filter((course) => {
          const translation = course.translations?.[locale];
          return (
            !translation?.description || translation.outcomes?.length !== course.outcomes?.length
          );
        });

        // Assert
        expect(untranslated.map((course) => course.slug)).toEqual([]);
      },
    );

    test("WHEN the Advanced Intermediate Course is parsed THEN it declares no sounds", () => {
      // Arrange
      const advanced = courseOf("advanced-intermediate-course");

      // Act
      const sounds = advanced?.sounds;

      // Assert
      expect(sounds).toBeUndefined();
    });
  });
});
