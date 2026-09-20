// @vitest-environment node
import { reportHandledError } from "@/lib/report-handled-error/report-handled-error";
import { DOCKER_AVAILABLE } from "@/test-setup/libsql-container/libsql-container";
import {
  startMailpitContainer,
  type StartedMailpit,
} from "@/test-setup/mailpit-container/mailpit-container";

import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { SmtpEmailSender } from "./smtp-email-sender";

vi.mock("@/lib/report-handled-error/report-handled-error", () => ({
  reportHandledError: vi.fn(),
}));

/**
 * Drives a REAL SMTP server (Mailpit in a container) rather than a mocked
 * transport: what breaks a sender is the wire — multipart bodies, envelope
 * addresses, a server that is not there — and a mock agrees with whatever the
 * code does.
 */
describe.skipIf(!DOCKER_AVAILABLE)("SmtpEmailSender (integration)", () => {
  let mailpit: StartedMailpit;

  beforeAll(async () => {
    mailpit = await startMailpitContainer();
  }, 180_000);

  afterAll(async () => {
    await mailpit?.stop();
  });

  test("delivers the HTML body and its plain-text alternative", async () => {
    const to = faker.internet.email().toLowerCase();
    const sender = new SmtpEmailSender({
      host: mailpit.smtpHost,
      port: mailpit.smtpPort,
      secure: false,
      from: "English Course <no-reply@english-course.online>",
    });

    const result = await sender.send({
      to,
      subject: "Verify your email",
      html: "<p>Open <a href='https://example.com/verify'>this link</a></p>",
      text: "Open this link: https://example.com/verify",
    });

    expect(result.isOk()).toBe(true);
    const message = await mailpit.latestMessageTo(to);
    expect(message.subject).toBe("Verify your email");
    expect(message.html).toContain("https://example.com/verify");
    expect(message.text).toContain("Open this link: https://example.com/verify");
  });

  test("reports a server that refuses the connection as a delivery error", async () => {
    const sender = new SmtpEmailSender({
      host: "127.0.0.1",
      port: 1,
      secure: false,
      from: "no-reply@english-course.online",
    });

    const result = await sender.send({
      to: faker.internet.email(),
      subject: "Unreachable",
      html: "<p>x</p>",
      text: "x",
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("email-delivery-failed");
    expect(reportHandledError).toHaveBeenCalledWith(result._unsafeUnwrapErr().cause, {
      where: "smtp-email-sender",
    });
  });
});
