import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { isPersonalPath } from "./personal-routes";

const slug = () => faker.helpers.slugify(faker.lorem.words(2)).toLowerCase();

describe("isPersonalPath", () => {
  test.each([
    ["a course", `/courses/${slug()}`],
    ["a lesson", `/courses/${slug()}/modules/${slug()}/lessons/${faker.string.uuid()}`],
    ["My learning", "/learning"],
    ["Achievements", "/achievements"],
    ["Profile", "/profile"],
    ["onboarding step one", "/start"],
    ["onboarding step two", "/start/avatar"],
  ])("WHEN the path is %s THEN it needs a session", (_, path) => {
    expect(isPersonalPath(path)).toBe(true);
  });

  test.each([
    ["the home", "/"],
    ["sign-in", "/sign-in"],
    ["sign-up", "/sign-up"],
    ["forgot-password", "/forgot-password"],
    ["reset-password", "/reset-password"],
    ["a lookalike of a personal route", "/learning-paths"],
    ["the bare courses segment", "/courses"],
  ])("WHEN the path is %s THEN it stays public", (_, path) => {
    expect(isPersonalPath(path)).toBe(false);
  });
});
