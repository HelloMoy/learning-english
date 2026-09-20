import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { isSignInReturnPath, resolveSignInReturn, signInPath } from "./sign-in-return-path";

const slug = () => faker.helpers.slugify(faker.lorem.words(2)).toLowerCase();

describe("isSignInReturnPath", () => {
  test.each([
    ["a course", `/courses/${slug()}`],
    ["Achievements", "/achievements"],
    ["a lesson with a query", `/courses/${slug()}/modules/${slug()}/lessons/l?t=1:30`],
    ["onboarding with its own next", "/start?next=%2Fcourses%2Fc"],
  ])("WHEN next is %s THEN it is accepted", (_, value) => {
    expect(isSignInReturnPath(value)).toBe(true);
  });

  test.each([
    ["empty", ""],
    ["an external URL", "https://evil.example"],
    ["protocol-relative", "//evil.example/learning"],
    ["a backslash trick", "/\\evil.example"],
    ["a parent segment", "/courses/../../etc"],
    ["a public page", "/sign-in"],
    ["the home", "/"],
    ["a relative path", "learning"],
  ])("WHEN next is %s THEN it is refused", (_, value) => {
    expect(isSignInReturnPath(value)).toBe(false);
  });
});

describe("resolveSignInReturn", () => {
  test("WHEN next is valid THEN it is where the learner goes", () => {
    expect(resolveSignInReturn("/achievements")).toBe("/achievements");
  });

  test("WHEN next is invalid or missing THEN the learner goes to My learning", () => {
    expect(resolveSignInReturn("https://evil.example")).toBe("/learning");
    expect(resolveSignInReturn(null)).toBe("/learning");
  });
});

describe("signInPath", () => {
  test("WHEN given a valid next THEN it is carried, encoded", () => {
    expect(signInPath("/courses/c?x=1")).toBe(
      `/sign-in?next=${encodeURIComponent("/courses/c?x=1")}`,
    );
  });

  test("WHEN given nothing or something invalid THEN the bare sign-in path is returned", () => {
    expect(signInPath()).toBe("/sign-in");
    expect(signInPath("//evil.example")).toBe("/sign-in");
  });
});
