import { routing } from "@/i18n/routing";

import { describe, expect, test } from "vitest";

import { isRecordableRoute } from "./recordable-route";

/**
 * Guards the `product-analytics` capability's "Sessions are recorded only
 * with consent, and never on credential pages". The routes are spelled out:
 * the behaviour is tied to exactly these four.
 */

const CREDENTIAL_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
const ORDINARY_ROUTES = [
  "/",
  "/learning",
  "/profile",
  "/courses/c/modules/m/lessons/l",
  "/privacy",
];

describe("isRecordableRoute", () => {
  test.each(CREDENTIAL_ROUTES)("%s is never recorded", (route) => {
    expect(isRecordableRoute(route)).toBe(false);
  });

  test.each(routing.locales.flatMap((locale) => CREDENTIAL_ROUTES.map((r) => `/${locale}${r}`)))(
    "%s is never recorded, whichever locale it is opened in",
    (route) => {
      expect(isRecordableRoute(route)).toBe(false);
    },
  );

  test("a credential route is not recorded with a trailing segment either", () => {
    expect(isRecordableRoute("/en/reset-password/anything")).toBe(false);
  });

  test.each(ORDINARY_ROUTES)("%s may be recorded", (route) => {
    expect(isRecordableRoute(route)).toBe(true);
  });

  test.each(routing.locales.map((locale) => `/${locale}`))(
    "the home %s may be recorded",
    (route) => {
      expect(isRecordableRoute(route)).toBe(true);
    },
  );

  test("a route that only starts with the same letters may be recorded", () => {
    expect(isRecordableRoute("/en/sign-in-help")).toBe(true);
  });
});
