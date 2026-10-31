import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";

import { faker } from "@faker-js/faker";
import posthog from "posthog-js";
import { describe, expect, test, vi } from "vitest";

import {
  captureProductEvent,
  consentStatus,
  consentStore,
  denyConsent,
  forgetLearner,
  grantConsent,
  identifyLearner,
  reconsiderConsent,
  startProductAnalytics,
  startRecording,
  stopRecording,
} from "./product-analytics";

// The SDK itself is the one thing here that cannot run under jsdom without
// reaching for the network, so the start-up test replaces it. Every other
// test attaches a fake client and never loads this module at all.
vi.mock("posthog-js", () => ({
  default: { init: vi.fn(), get_explicit_consent_status: () => "pending" },
}));

/**
 * Guards the `product-analytics` capability at the one module allowed to talk
 * to the PostHog SDK.
 */

function lessonReference() {
  return { lessonId: faker.string.uuid() };
}

describe("product analytics without a client", () => {
  test("the consent status is unavailable, so no banner has anything to ask", () => {
    expect(consentStatus()).toBe("unavailable");
  });

  test("every operation does nothing, which is what keeps development and CI silent", () => {
    captureProductEvent("video_ended", lessonReference());
    grantConsent();
    denyConsent();
    reconsiderConsent();
    identifyLearner(faker.string.uuid());
    forgetLearner();
    startRecording();
    stopRecording();

    expect(consentStore.getState()).toEqual({ status: "unavailable", isReconsidering: false });
  });
});

describe("starting product analytics", () => {
  test("WHEN it starts THEN the SDK is initialized with the token and configuration it was given", async () => {
    const token = faker.string.alphanumeric(40);
    const config = { api_host: `/${faker.lorem.slug()}` };

    await startProductAnalytics({ token, config });

    expect(posthog.init).toHaveBeenCalledExactlyOnceWith(token, config);
  });

  test("WHEN it has started THEN the visitor's answer is known, so the banner can ask", async () => {
    await startProductAnalytics({ token: faker.string.alphanumeric(40), config: {} });

    expect(consentStatus()).toBe("pending");
  });
});

describe("named events", () => {
  test("a catalogued event reaches PostHog with its properties", () => {
    const client = givenProductAnalytics("granted");
    const lesson = lessonReference();

    captureProductEvent("video_seeked", { ...lesson, fromSeconds: 12, toSeconds: 42 });

    expect(client.capture).toHaveBeenCalledWith("video_seeked", {
      ...lesson,
      fromSeconds: 12,
      toSeconds: 42,
    });
  });

  test("an undeclared event or a mistyped property does not compile", () => {
    givenProductAnalytics("granted");

    // @ts-expect-error -- the catalogue declares no such event
    captureProductEvent("learner_typed_something", { text: faker.lorem.sentence() });
    // @ts-expect-error -- a playback rate is a number
    captureProductEvent("video_speed_changed", { ...lessonReference(), rate: "fast" });
  });
});

describe("consent", () => {
  test.each(["pending", "granted", "denied"] as const)(
    "WHEN PostHog starts with the choice %s THEN that is the status",
    (choice) => {
      givenProductAnalytics(choice);

      expect(consentStatus()).toBe(choice);
    },
  );

  test("WHEN the visitor accepts THEN PostHog is opted in and the status is granted", () => {
    const client = givenProductAnalytics("pending");

    grantConsent();

    expect(client.opt_in_capturing).toHaveBeenCalledOnce();
    expect(consentStatus()).toBe("granted");
  });

  test("WHEN the visitor declines THEN PostHog is opted out and the status is denied", () => {
    const client = givenProductAnalytics("pending");

    denyConsent();

    expect(client.opt_out_capturing).toHaveBeenCalledOnce();
    expect(consentStatus()).toBe("denied");
  });

  test("WHEN the visitor asks to reconsider THEN the question is open until they answer", () => {
    givenProductAnalytics("granted");

    reconsiderConsent();
    const whileAsking = consentStore.getState().isReconsidering;
    denyConsent();

    expect(whileAsking).toBe(true);
    expect(consentStore.getState()).toEqual({ status: "denied", isReconsidering: false });
  });
});

describe("identity", () => {
  test("WHEN the visitor accepted THEN the learner is identified by account ID alone", () => {
    const client = givenProductAnalytics("granted");
    const accountId = faker.string.uuid();

    identifyLearner(accountId);

    expect(client.identify).toHaveBeenCalledExactlyOnceWith(accountId);
  });

  test.each(["pending", "denied"] as const)(
    "WHEN the choice is %s THEN the learner is not identified",
    (choice) => {
      const client = givenProductAnalytics(choice);

      identifyLearner(faker.string.uuid());

      expect(client.identify).not.toHaveBeenCalled();
    },
  );

  test("WHEN an identified learner is gone THEN the identity ends and the choice survives", () => {
    const client = givenProductAnalytics("granted");
    identifyLearner(faker.string.uuid());

    forgetLearner();

    expect(client.reset).toHaveBeenCalledOnce();
    expect(consentStatus()).toBe("granted");
  });

  test("WHEN the choice is restored after the identity ends THEN no second acceptance is reported", () => {
    const client = givenProductAnalytics("granted");
    identifyLearner(faker.string.uuid());

    forgetLearner();

    expect(client.opt_in_capturing).toHaveBeenCalledExactlyOnceWith({ captureEventName: false });
  });

  test("WHEN nobody was identified THEN an anonymous visitor keeps the identity they had", () => {
    const client = givenProductAnalytics("granted");

    forgetLearner();

    expect(client.reset).not.toHaveBeenCalled();
  });
});

describe("recording", () => {
  test("WHEN the visitor accepted THEN recording can be started and stopped", () => {
    const client = givenProductAnalytics("granted");

    startRecording();
    stopRecording();

    expect(client.startSessionRecording).toHaveBeenCalledOnce();
    expect(client.stopSessionRecording).toHaveBeenCalledOnce();
  });

  test.each(["pending", "denied"] as const)(
    "WHEN the choice is %s THEN recording cannot be started",
    (choice) => {
      const client = givenProductAnalytics(choice);

      startRecording();

      expect(client.startSessionRecording).not.toHaveBeenCalled();
    },
  );
});
