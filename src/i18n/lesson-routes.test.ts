import { Slug } from "@/domain/entities/slug/slug";

import { describe, expect, test } from "vitest";

import { courseDetailPath, courseOverviewPath, moduleOverviewPath } from "./lesson-routes";

describe("moduleOverviewPath", () => {
  test("WHEN given a course and one of its lessons (modules) THEN it builds the module overview path", () => {
    const course = { slug: Slug.parse("basic-course") };
    const fluency = { slug: Slug.parse("5-fluidez-y-velocidad") };

    expect(moduleOverviewPath(course, fluency)).toBe(
      "/courses/basic-course/modules/5-fluidez-y-velocidad",
    );
  });
});

describe("courseDetailPath", () => {
  test("WHEN given a course THEN it builds the path of its course page", () => {
    const course = { slug: Slug.parse("basic-course") };

    expect(courseDetailPath(course)).toBe("/courses/basic-course/about");
  });
});

describe("courseOverviewPath", () => {
  test("WHEN given a course THEN it builds the path of its progress board", () => {
    const course = { slug: Slug.parse("basic-course") };

    expect(courseOverviewPath(course)).toBe("/courses/basic-course/progress");
  });
});
