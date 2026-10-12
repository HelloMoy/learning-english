import { faker } from "@faker-js/faker";
import type { CaptureResult, Properties } from "posthog-js";
import { describe, expect, test } from "vitest";

import {
  ANALYTICS_RELAY_PATH,
  NOT_CAPTURED_CLASS,
  productAnalyticsOptions,
} from "./product-analytics-options";

/**
 * Guards the `product-analytics` capability at the one place every claim the
 * privacy policy makes about PostHog is decided: what the client is started
 * with.
 */

function startedConfig() {
  const options = productAnalyticsOptions(faker.string.alphanumeric(40));
  if (!options) throw new Error("expected PostHog to start when a token is set");
  return options.config;
}

const SITE = "https://www.english-course.online";

function pageView(properties: Properties): CaptureResult {
  return { uuid: faker.string.uuid(), event: "$pageview", properties };
}

/** Passes an event through the hook PostHog runs before sending anything. */
function asSent(event: CaptureResult): CaptureResult {
  const beforeSend = startedConfig().before_send;
  if (typeof beforeSend !== "function") throw new Error("expected a single before_send hook");
  const sent = beforeSend(event);
  if (!sent) throw new Error("expected the event to be sent, not dropped");
  return sent;
}

describe("productAnalyticsOptions", () => {
  test.each([undefined, ""])(
    "WHEN the project token is %j THEN PostHog is not started",
    (token) => {
      expect(productAnalyticsOptions(token)).toBeNull();
    },
  );

  test("WHEN a project token is set THEN PostHog is started with it", () => {
    const token = faker.string.alphanumeric(40);

    expect(productAnalyticsOptions(token)?.token).toBe(token);
  });

  test("requests go to the application's own relay, and links open PostHog's US app", () => {
    expect(startedConfig()).toMatchObject({
      api_host: ANALYTICS_RELAY_PATH,
      ui_host: "https://us.posthog.com",
    });
  });

  test.each(["/e/", "/i/v0/e/", "/s/", "/flags/"])(
    "the SDK's own path %s is requested without its trailing slash, which Next would redirect",
    (path) => {
      const requested = startedConfig().rewriteRequestPath?.(
        new URL(`${SITE}${ANALYTICS_RELAY_PATH}${path}?ip=0`),
      );

      expect(requested?.pathname).toBe(`${ANALYTICS_RELAY_PATH}${path.slice(0, -1)}`);
      expect(requested?.search).toBe("?ip=0");
    },
  );

  test("a script path, which has no trailing slash, is requested as it is", () => {
    const script = new URL(`${SITE}${ANALYTICS_RELAY_PATH}/static/array.js`);

    expect(startedConfig().rewriteRequestPath?.(script).href).toBe(script.href);
  });

  test("nothing is stored or sent until the visitor answers, and a refusal is still counted", () => {
    expect(startedConfig().cookieless_mode).toBe("on_reject");
  });

  test("a person profile exists only for a learner who was identified", () => {
    expect(startedConfig().person_profiles).toBe("identified_only");
  });

  test("the cookie stays on the host that set it and travels over HTTPS only", () => {
    expect(startedConfig()).toMatchObject({ cross_subdomain_cookie: false, secure_cookie: true });
  });

  test("recording is off at startup, so only the application can start it", () => {
    expect(startedConfig().disable_session_recording).toBe(true);
  });

  test("a recording masks every input and captures no request body or header", () => {
    expect(startedConfig().session_recording).toMatchObject({
      maskAllInputs: true,
      recordBody: false,
      recordHeaders: false,
    });
  });

  test("a recording blanks every element marked as not captured, the class click capture also skips", () => {
    expect(NOT_CAPTURED_CLASS).toBe("ph-no-capture");
    expect(startedConfig().session_recording?.blockClass).toBe(NOT_CAPTURED_CLASS);
  });

  test("a recording does not capture the browser console", () => {
    expect(startedConfig().enable_recording_console_log).toBe(false);
  });

  test("errors are not sent to PostHog: they belong to Sentry, which redacts them", () => {
    expect(startedConfig().capture_exceptions).toBe(false);
  });

  test("heatmaps are captured", () => {
    expect(startedConfig().capture_heatmaps).toBe(true);
  });

  test("WHEN a page view is captured on the reset-password link THEN its token is not sent", () => {
    const secret = faker.string.alphanumeric(32);

    const sent = asSent(pageView({ $current_url: `${SITE}/en/reset-password?token=${secret}` }));

    expect(sent.properties.$current_url).toBe(`${SITE}/en/reset-password`);
    expect(JSON.stringify(sent)).not.toContain(secret);
  });

  test("WHEN PostHog stores the first-contact URL on the person THEN it is cleaned there too", () => {
    const secret = faker.string.alphanumeric(32);
    const landing = `${SITE}/en/reset-password?token=${secret}`;

    const sent = asSent({
      ...pageView({ $set_once: { $initial_current_url: landing } }),
      $set_once: { $initial_current_url: landing },
    });

    expect(sent.$set_once?.$initial_current_url).toBe(`${SITE}/en/reset-password`);
    expect(JSON.stringify(sent)).not.toContain(secret);
  });

  test("WHEN a lesson URL carries a query string and a fragment THEN its whole path survives", () => {
    const lesson = `${SITE}/es/courses/${faker.lorem.slug()}/modules/${faker.lorem.slug()}/lessons/${faker.string.uuid()}`;

    const sent = asSent(pageView({ $current_url: `${lesson}?${faker.lorem.word()}=1#notes` }));

    expect(sent.properties.$current_url).toBe(lesson);
  });

  test("WHEN the visitor arrives from a search THEN what they searched for is not sent", () => {
    const query = faker.lorem.word();

    const sent = asSent(pageView({ $referrer: `https://search.example/results?q=${query}` }));

    expect(sent.properties.$referrer).toBe("https://search.example/results");
  });

  test("WHEN a value is not a web address THEN it is sent exactly as captured", () => {
    const properties = {
      $browser: faker.internet.userAgent(),
      $pathname: "/en/reset-password",
      $viewport_width: faker.number.int({ min: 320, max: 2560 }),
      $referrer: "$direct",
      $current_url: `${SITE}/en`,
      contact: "mailto:someone@example.com?subject=hello",
    };
    const capturedAt = faker.date.recent();

    const sent = asSent({ ...pageView(properties), timestamp: capturedAt });

    expect(sent.properties).toEqual(properties);
    expect(sent.timestamp).toBe(capturedAt);
  });
});
