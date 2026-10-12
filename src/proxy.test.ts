// @vitest-environment node
import { ANALYTICS_RELAY_PATH } from "@/lib/product-analytics-options/product-analytics-options";

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, test, vi } from "vitest";

import proxy, { config } from "./proxy";

// next-intl's middleware imports `next/server` without an extension, which
// Node's ESM resolver refuses outside Next's own bundler. What it does with a
// request is not under test here — only what the proxy does before asking it.
vi.mock("next-intl/middleware", () => ({ default: () => () => NextResponse.next() }));

/**
 * Guards where the analytics relay sits in the proxy: ahead of the session
 * gate and of locale handling, and reachable for PostHog's script files.
 */

const ORIGIN = "https://www.english-course.online";

describe("the proxy matcher", () => {
  test.each([
    `${ANALYTICS_RELAY_PATH}/e/`,
    `${ANALYTICS_RELAY_PATH}/static/array.js`,
    `${ANALYTICS_RELAY_PATH}/array/phc_token/config.js`,
  ])("runs for the analytics request %s, dots and all", (path) => {
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
  });

  test.each(["/favicon.ico", "/api/auth/get-session", "/_next/static/chunk.js"])(
    "still skips %s",
    (path) => {
      expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(false);
    },
  );
});

describe("the proxy", () => {
  test("relays an analytics request with no session instead of sending it to sign-in or a locale", () => {
    const response = proxy(new NextRequest(`${ORIGIN}${ANALYTICS_RELAY_PATH}/e/`));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://us.i.posthog.com/e/");
  });

  test("still sends a signed-out visitor from a personal page to sign-in", () => {
    const response = proxy(new NextRequest(`${ORIGIN}/en/learning`));

    expect(response.headers.get("location")).toContain("/en/sign-in");
  });
});
