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

  describe("GIVEN a link into the app rather than into the auth API", () => {
    test("WHEN it carries no callbackURL THEN the locale comes from its first path segment", () => {
      // The password-changed notice links straight at a page, so the locale it
      // is written in is the one already spelled in the path.
      expect(localeFromActionUrl("https://english-course.online/es/forgot-password")).toBe("es");
      expect(localeFromActionUrl("http://localhost:3000/pt/forgot-password")).toBe("pt");
    });

    test("WHEN it carries a callbackURL too THEN that stays the source", () => {
      expect(localeFromActionUrl("http://localhost:3000/en/x?callbackURL=%2Fpt%2Flearning")).toBe(
        "pt",
      );
    });

    test("WHEN its first segment is not a locale THEN the default still wins", () => {
      expect(localeFromActionUrl("http://localhost:3000/api/auth/verify-email?token=abc")).toBe(
        "en",
      );
      expect(localeFromActionUrl("http://localhost:3000/fr/forgot-password")).toBe("en");
    });
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

  test("writes a change-email approval that names the address it would move to", async () => {
    const url = "http://localhost:3000/api/auth/verify-email?token=tok&callbackURL=%2Fes%2Fprofile";

    const email = await composeAccountEmail("change-email", url, { newEmail: "ana.g@example.com" });

    expect(email.subject).toBe(es.Emails.ChangeEmail.subject);
    expect(email.text).toContain("ana.g@example.com");
    expect(email.text).toContain(es.Emails.ChangeEmail.ignore);
    expect(email.html).toContain(es.Emails.ChangeEmail.button);
  });

  test("writes a password-changed notice in the locale its own link spells", async () => {
    const url = "https://english-course.online/es/forgot-password";

    const email = await composeAccountEmail("password-changed", url);

    expect(email.subject).toBe(es.Emails.PasswordChanged.subject);
    expect(email.text).toContain(es.Emails.PasswordChanged.ignore);
    expect(email.html).toContain(es.Emails.PasswordChanged.button);
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
