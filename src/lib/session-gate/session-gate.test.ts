// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";

import { sessionGate } from "./session-gate";

/**
 * Guards the `learner-account` capability's "Personal routes require a
 * session" at its first layer: the proxy's optimistic cookie check.
 */

const ORIGIN = "http://localhost:3000";
const SESSION_COOKIE = "better-auth.session_token=token.signature";

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, { headers: cookie ? { cookie } : {} });
}

describe("sessionGate", () => {
  test("sends a visitor without a session from a lesson to sign-in, carrying the path", () => {
    const response = sessionGate(request("/en/courses/c/modules/m/lessons/l"));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      `${ORIGIN}/en/sign-in?next=${encodeURIComponent("/courses/c/modules/m/lessons/l")}`,
    );
  });

  test("keeps the query string in next", () => {
    const response = sessionGate(request("/es/start?next=%2Fcourses%2Fc"));

    expect(response?.headers.get("location")).toBe(
      `${ORIGIN}/es/sign-in?next=${encodeURIComponent("/start?next=%2Fcourses%2Fc")}`,
    );
  });

  test("lets a request carrying a session cookie through", () => {
    expect(sessionGate(request("/en/learning", SESSION_COOKIE))).toBeUndefined();
  });

  test.each(["/en", "/pt/sign-in", "/es/forgot-password", "/en/reset-password?token=t"])(
    "lets the public route %s through without a session",
    (path) => {
      expect(sessionGate(request(path))).toBeUndefined();
    },
  );

  test("lets a course route's sharing image through, since it carries no learner data", () => {
    expect(sessionGate(request("/en/courses/c/modules/m/opengraph-image"))).toBeUndefined();
  });

  test("leaves a path without a locale to next-intl, which adds one first", () => {
    expect(sessionGate(request("/courses/c"))).toBeUndefined();
  });
});
