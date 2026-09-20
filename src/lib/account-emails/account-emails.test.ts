// @vitest-environment node
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { composeAccountEmail, localeFromActionUrl } from "./account-emails";

/**
 * Guards the `transactional-email` capability's "Emails are sent in the locale
 * the learner acted in": the locale travels inside the link Better Auth
 * builds, because the email callbacks run without any request locale.
 */
describe("localeFromActionUrl", () => {
  test("reads the locale from the callbackURL of a verification link", () => {
    const url =
      "http://localhost:3000/api/auth/verify-email?token=abc&callbackURL=%2Fpt%2Flearning";

    expect(localeFromActionUrl(url)).toBe("pt");
  });

  test("reads the locale from the callbackURL of a reset link", () => {
    const url =
      "http://localhost:3000/api/auth/reset-password/abc?callbackURL=%2Fes%2Freset-password";

    expect(localeFromActionUrl(url)).toBe("es");
  });

  test("falls back to the default locale for an unknown or missing callback", () => {
    expect(localeFromActionUrl("http://localhost:3000/api/auth/verify-email?token=abc")).toBe("en");
    expect(
      localeFromActionUrl("http://localhost:3000/api/auth/verify-email?callbackURL=%2Ffr%2Fx"),
    ).toBe("en");
  });

  test("falls back to the default locale for a string that is not a URL", () => {
    expect(localeFromActionUrl("not a url")).toBe("en");
  });
});

describe("composeAccountEmail", () => {
  test.each([
    ["en", en],
    ["es", es],
    ["pt", pt],
  ] as const)("writes a verification email in %s", async (locale, messages) => {
    const url = `${faker.internet.url()}/api/auth/verify-email?callbackURL=%2F${locale}%2Flearning`;

    const email = await composeAccountEmail("verify-email", url);

    expect(email.subject).toBe(messages.Emails.VerifyEmail.subject);
    expect(email.html).toContain(messages.Emails.VerifyEmail.button);
    expect(email.html).toContain(`lang="${locale}"`);
    expect(email.text).toContain(messages.Emails.VerifyEmail.body);
  });

  test("writes a reset email whose link is the one it was given", async () => {
    const url =
      "http://localhost:3000/api/auth/reset-password/tok?callbackURL=%2Fes%2Freset-password";

    const email = await composeAccountEmail("reset-password", url);

    expect(email.subject).toBe(es.Emails.ResetPassword.subject);
    expect(email.html).toContain(url.replaceAll("&", "&amp;"));
    expect(email.text).toContain(url);
  });

  test("writes a delete-account confirmation in the locale of its callback", async () => {
    const url =
      "http://localhost:3000/api/auth/delete-user/callback?token=tok&callbackURL=%2Fpt%2Faccount-deleted";

    const email = await composeAccountEmail("delete-account", url);

    expect(email.subject).toBe(pt.Emails.DeleteAccount.subject);
    expect(email.text).toContain(pt.Emails.DeleteAccount.ignore);
  });
});
