import type { CourseManifest } from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";
import {
  shouldShowDraftCourses,
  visibleCourseManifests,
} from "@/adapters/persistence/content-manifest/visible-course-manifests/visible-course-manifests";

import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test } from "vitest";

describe("shouldShowDraftCourses", () => {
  describe("GIVEN SHOW_DRAFT_COURSES is not set", () => {
    test.each([
      ["development", true],
      ["test", true],
      ["production", false],
    ])("WHEN NODE_ENV is %s THEN drafts show is %s", (nodeEnv, expected) => {
      expect(shouldShowDraftCourses({ NODE_ENV: nodeEnv })).toBe(expected);
    });

    test("WHEN NODE_ENV is absent too THEN drafts show", () => {
      expect(shouldShowDraftCourses({})).toBe(true);
    });

    test("WHEN it is set to an empty string THEN it behaves as unset", () => {
      expect(shouldShowDraftCourses({ NODE_ENV: "production", SHOW_DRAFT_COURSES: "" })).toBe(
        false,
      );
    });
  });

  describe("GIVEN SHOW_DRAFT_COURSES asks for drafts", () => {
    test.each(["1", "true", "TRUE", "True", " true "])(
      "WHEN it is %s THEN drafts show even in production",
      (value) => {
        expect(shouldShowDraftCourses({ NODE_ENV: "production", SHOW_DRAFT_COURSES: value })).toBe(
          true,
        );
      },
    );
  });

  describe("GIVEN SHOW_DRAFT_COURSES refuses drafts", () => {
    test.each(["0", "false", "FALSE", "False", " false "])(
      "WHEN it is %s THEN drafts hide even in development",
      (value) => {
        expect(shouldShowDraftCourses({ NODE_ENV: "development", SHOW_DRAFT_COURSES: value })).toBe(
          false,
        );
      },
    );
  });

  describe("GIVEN SHOW_DRAFT_COURSES is misspelled", () => {
    test("WHEN it is treu THEN it throws naming the variable and the value", () => {
      const read = () => shouldShowDraftCourses({ SHOW_DRAFT_COURSES: "treu" });

      expect(read).toThrow(/SHOW_DRAFT_COURSES/);
      expect(read).toThrow(/treu/);
    });

    test("WHEN it is yes THEN it does not quietly hide drafts", () => {
      expect(() => shouldShowDraftCourses({ SHOW_DRAFT_COURSES: "yes" })).toThrow();
    });
  });
});

const ORIGINAL_FLAG = process.env.SHOW_DRAFT_COURSES;

afterEach(() => {
  if (ORIGINAL_FLAG === undefined) {
    delete process.env.SHOW_DRAFT_COURSES;
  } else {
    process.env.SHOW_DRAFT_COURSES = ORIGINAL_FLAG;
  }
});

/**
 * A course manifest with only the fields the filter reads. Cast because the
 * filter is deliberately blind to modules and lessons — declaring them here
 * would suggest it looks at them.
 */
function course(slug: string, draft: boolean): CourseManifest {
  return {
    slug,
    draft,
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
  } as unknown as CourseManifest;
}

describe("visibleCourseManifests", () => {
  describe("GIVEN drafts are shown", () => {
    test("WHEN the set holds a draft THEN every manifest survives in declaration order", () => {
      process.env.SHOW_DRAFT_COURSES = "1";
      const declared = [course("basic", false), course("advanced", true), course("expert", false)];

      const visible = visibleCourseManifests(declared);

      expect(visible.map((entry) => entry.slug)).toEqual(["basic", "advanced", "expert"]);
    });
  });

  describe("GIVEN drafts are hidden", () => {
    test("WHEN the set holds a draft THEN only published manifests survive, in order", () => {
      process.env.SHOW_DRAFT_COURSES = "0";
      const declared = [course("basic", false), course("advanced", true), course("expert", false)];

      const visible = visibleCourseManifests(declared);

      expect(visible.map((entry) => entry.slug)).toEqual(["basic", "expert"]);
    });

    test("WHEN no manifest is a draft THEN the set is returned whole", () => {
      process.env.SHOW_DRAFT_COURSES = "0";
      const declared = [course("basic", false), course("expert", false)];

      expect(visibleCourseManifests(declared)).toHaveLength(2);
    });

    test("WHEN every manifest is a draft THEN nothing survives", () => {
      process.env.SHOW_DRAFT_COURSES = "0";

      expect(visibleCourseManifests([course("advanced", true)])).toEqual([]);
    });
  });
});
