import { faker } from "@faker-js/faker";
import { eventFiltersIntegration, type Event } from "@sentry/nextjs";
import { describe, expect, test } from "vitest";

import { sentryInitOptions } from "./sentry-init-options";

/** The message of Sentry issue ENGLISH-COURSE-2, exactly as it was stored. */
const PLAYER_TEARDOWN_REJECTION =
  "Non-Error promise rejection captured with value: provider destroyed";

type EventFilter = ReturnType<typeof eventFiltersIntegration>;
type FilterClient = Parameters<NonNullable<EventFilter["processEvent"]>>[2];

function unhandledRejection(value: string): Event {
  return { exception: { values: [{ type: "UnhandledRejection", value }] } };
}

/**
 * Asks the SDK's own filter, configured with what Sentry is started with, so
 * the pattern is judged by the rule that will apply it and not by a reading
 * of that rule.
 */
function isReported(event: Event): boolean {
  const dsn = `https://${faker.string.alphanumeric(32)}@o1.ingest.sentry.io/1`;
  const filter = eventFiltersIntegration({ ignoreErrors: sentryInitOptions(dsn)?.ignoreErrors });
  const clientWithoutOptions = { getOptions: () => ({}) } as unknown as FilterClient;
  return filter.processEvent?.(event, {}, clientWithoutOptions) !== null;
}

describe("sentryInitOptions", () => {
  test.each([undefined, ""])("WHEN the DSN is %j THEN Sentry is not started", (dsn) => {
    expect(sentryInitOptions(dsn)).toBeNull();
  });

  test("WHEN a DSN is set THEN Sentry reports errors only, without personal data", () => {
    const dsn = `https://${faker.string.alphanumeric(32)}@o1.ingest.sentry.io/1`;

    const options = sentryInitOptions(dsn);

    expect(options).toMatchObject({ dsn, sendDefaultPii: false });
    expect(options).not.toHaveProperty("tracesSampleRate");
    expect(options).not.toHaveProperty("replaysSessionSampleRate");
  });

  test("WHEN the player rejects its pending commands on teardown THEN the rejection is not reported", () => {
    expect(isReported(unhandledRejection(PLAYER_TEARDOWN_REJECTION))).toBe(false);
  });

  test("WHEN a rejection only mentions the same words THEN it is still reported", () => {
    const lookAlike =
      "Non-Error promise rejection captured with value: provider destroyed while saving progress";

    expect(isReported(unhandledRejection(lookAlike))).toBe(true);
  });

  test("WHEN a real Error carries the same message THEN it is still reported", () => {
    const thrown: Event = {
      exception: { values: [{ type: "Error", value: "provider destroyed" }] },
    };

    expect(isReported(thrown)).toBe(true);
  });
});
