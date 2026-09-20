import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { sentryInitOptions } from "./sentry-init-options";

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
});
