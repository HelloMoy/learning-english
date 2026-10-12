// @vitest-environment node
import { ANALYTICS_RELAY_PATH } from "@/lib/product-analytics-options/product-analytics-options";

import { faker } from "@faker-js/faker";
import { NextRequest, type NextResponse } from "next/server";
import { describe, expect, test } from "vitest";

import { analyticsRelay } from "./analytics-relay";

/**
 * Guards the `product-analytics` capability's "Analytics requests go through
 * the application's own origin" — above all that the session cookie, which the
 * browser attaches to every same-origin request, never reaches PostHog.
 */

const ORIGIN = "https://www.english-course.online";
const SESSION_COOKIE = "better-auth.session_token=token.signature";

function request(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, { method: "POST", headers });
}

function relayed(path: string, headers: Record<string, string> = {}): NextResponse {
  const response = analyticsRelay(request(path, headers));
  if (!response) throw new Error(`expected ${path} to be relayed`);
  return response;
}

/**
 * The headers Next will send upstream. `NextResponse.rewrite` carries a
 * request-header override as `x-middleware-override-headers` (the complete
 * list of names to keep — every other header is deleted) plus one
 * `x-middleware-request-<name>` per value. Reading that contract is the only
 * way to see, without a network, what the upstream host receives.
 */
function forwardedHeaders(response: NextResponse): Map<string, string | null> {
  const names = response.headers.get("x-middleware-override-headers")?.split(",") ?? [];
  return new Map(names.map((name) => [name, response.headers.get(`x-middleware-request-${name}`)]));
}

function upstreamUrl(response: NextResponse): string | null {
  return response.headers.get("x-middleware-rewrite");
}

describe("analyticsRelay", () => {
  test.each(["/en", "/en/learning", "/api/auth/get-session", "/pulsewidth", "/en/pulse/e/"])(
    "leaves %s alone",
    (path) => {
      expect(analyticsRelay(request(path))).toBeUndefined();
    },
  );

  test("forwards an event to PostHog's US ingestion host, without the relay prefix", () => {
    const response = relayed(`${ANALYTICS_RELAY_PATH}/e/?compression=gzip-js`);

    expect(upstreamUrl(response)).toBe("https://us.i.posthog.com/e/?compression=gzip-js");
    expect(forwardedHeaders(response).get("host")).toBe("us.i.posthog.com");
  });

  test.each(["/static/array.js", "/array/phc_token/config.js"])(
    "forwards the script %s to PostHog's US asset host",
    (script) => {
      const response = relayed(`${ANALYTICS_RELAY_PATH}${script}`);

      expect(upstreamUrl(response)).toBe(`https://us-assets.i.posthog.com${script}`);
      expect(forwardedHeaders(response).get("host")).toBe("us-assets.i.posthog.com");
    },
  );

  test("WHEN the browser attaches the session cookie THEN it is not forwarded", () => {
    const forwarded = forwardedHeaders(
      relayed(`${ANALYTICS_RELAY_PATH}/e/`, {
        cookie: SESSION_COOKIE,
        authorization: `Bearer ${faker.string.alphanumeric(32)}`,
      }),
    );

    expect(forwarded.has("cookie")).toBe(false);
    expect(forwarded.has("authorization")).toBe(false);
  });

  test("WHEN the page address carries a secret THEN the referer is not forwarded", () => {
    const secret = faker.string.alphanumeric(32);

    const response = relayed(`${ANALYTICS_RELAY_PATH}/e/`, {
      referer: `${ORIGIN}/en/reset-password?token=${secret}`,
    });

    expect(forwardedHeaders(response).has("referer")).toBe(false);
    expect(JSON.stringify([...response.headers])).not.toContain(secret);
  });

  test("WHEN the platform adds headers of its own THEN they are not forwarded", () => {
    const forwarded = forwardedHeaders(
      relayed(`${ANALYTICS_RELAY_PATH}/e/`, {
        "x-vercel-oidc-token": faker.string.alphanumeric(64),
        "x-vercel-proxy-signature": faker.string.alphanumeric(32),
      }),
    );

    expect([...forwarded.keys()].filter((name) => name.startsWith("x-vercel"))).toEqual([]);
  });

  test("forwards what PostHog needs to count a visitor and read the payload", () => {
    const visitor = {
      "x-forwarded-for": faker.internet.ipv4(),
      "user-agent": faker.internet.userAgent(),
      "content-type": "text/plain",
      "accept-language": "es-MX",
    };

    const forwarded = forwardedHeaders(relayed(`${ANALYTICS_RELAY_PATH}/e/`, visitor));

    expect(Object.fromEntries(forwarded)).toMatchObject(visitor);
  });
});
