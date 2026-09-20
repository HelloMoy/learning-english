import { readFileSync } from "node:fs";
import path from "node:path";

import { faker } from "@faker-js/faker";
import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { reportHandledError } from "./report-handled-error";

vi.mock("@sentry/nextjs", () => ({ getClient: vi.fn(), captureException: vi.fn() }));

const getClient = vi.mocked(Sentry.getClient);
const captureException = vi.mocked(Sentry.captureException);

beforeEach(() => {
  getClient.mockReset();
  captureException.mockReset();
});

describe("reportHandledError", () => {
  test("WHEN Sentry was never started THEN nothing is captured", async () => {
    getClient.mockReturnValue(undefined);

    await reportHandledError(new Error("boom"), { where: "email" });

    expect(captureException).not.toHaveBeenCalled();
  });

  test("WHEN Sentry is running THEN the error is captured with its context", async () => {
    getClient.mockReturnValue({} as never);
    const error = new Error("boom");

    await reportHandledError(error, { where: "learner-store", lessons: 3 });

    expect(captureException).toHaveBeenCalledWith(error, {
      extra: { where: "learner-store", lessons: 3 },
    });
  });

  test("WHEN the context carries an email address THEN it never leaves the app", async () => {
    getClient.mockReturnValue({} as never);
    const email = faker.internet.email();

    await reportHandledError(new Error("boom"), { where: "email", recipient: `to ${email}` });

    const extra = captureException.mock.calls[0]![1] as { extra: Record<string, unknown> };
    expect(JSON.stringify(extra)).not.toContain(email);
    expect(extra.extra.recipient).toBe("to [email]");
  });

  test("WHEN the context carries a message body THEN the body is dropped", async () => {
    getClient.mockReturnValue({} as never);

    await reportHandledError(new Error("boom"), {
      where: "email",
      html: "<p>secret</p>",
      text: "secret",
    });

    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { where: "email" },
    });
  });
});

describe("reportHandledError's cost", () => {
  test("WHEN the module is loaded THEN the Sentry SDK is not", () => {
    // Everything that can fail imports this helper, the learner store among
    // them: loading the SDK eagerly would put it in every client bundle and in
    // every test file's setup.
    const source = readFileSync(path.join(__dirname, "report-handled-error.ts"), "utf8");

    expect(source).not.toMatch(/^import .*@sentry\/nextjs/m);
  });
});
