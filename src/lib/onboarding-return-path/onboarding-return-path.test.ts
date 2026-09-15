import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { isCourseReturnPath, withReturnPath } from "./onboarding-return-path";

const courseSlug = () => faker.helpers.slugify(faker.lorem.words(2)).toLowerCase();

describe("withReturnPath", () => {
  test("WHEN the return path is a course route THEN it is appended encoded as next", () => {
    const returnPath = `/courses/${courseSlug()}/modules/${courseSlug()}`;

    expect(withReturnPath("/start", returnPath)).toBe(
      `/start?next=${encodeURIComponent(returnPath)}`,
    );
  });

  test("WHEN the return path is unsafe THEN the path is left bare", () => {
    expect(withReturnPath("/start", "//evil.example/courses/c")).toBe("/start");
  });

  test("WHEN there is no return path THEN the path is left bare", () => {
    expect(withReturnPath("/start/avatar", undefined)).toBe("/start/avatar");
  });
});

describe("isCourseReturnPath", () => {
  test("WHEN the path is a course route THEN it is accepted", () => {
    expect(isCourseReturnPath(`/courses/${courseSlug()}`)).toBe(true);
  });

  test("WHEN the path is a lesson route THEN it is accepted", () => {
    const lessonPath = `/courses/${courseSlug()}/modules/${courseSlug()}/lessons/${faker.string.uuid()}`;

    expect(isCourseReturnPath(lessonPath)).toBe(true);
  });

  test.each([
    ["empty", ""],
    ["an external URL", "https://evil.example/courses/c"],
    ["protocol-relative", "//evil.example/courses/c"],
    ["a doubled slash inside", "/courses//evil.example"],
    ["a backslash", "/courses/\\evil.example"],
    ["a scheme after the prefix", "/courses/javascript:alert(1)"],
    ["a traversal segment", "/courses/../profile"],
    ["a non-course internal path", "/profile"],
    ["the bare courses prefix", "/courses/"],
    ["relative", "courses/c"],
  ])("WHEN the value is %s THEN it is rejected", (_, value) => {
    expect(isCourseReturnPath(value)).toBe(false);
  });
});
