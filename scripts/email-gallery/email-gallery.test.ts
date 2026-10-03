// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { routing } from "@/i18n/routing";
import { ACCOUNT_EMAIL_KINDS } from "@/lib/account-emails/account-emails";
import es from "@/messages/es.json";

import { beforeAll, describe, expect, test } from "vitest";

import {
  renderEmailGallery,
  SAMPLE_NEW_EMAIL,
  writeEmailGallery,
  type EmailGalleryEntry,
} from "./email-gallery";

/**
 * Guards the `email-gallery` capability: every account email, in every locale,
 * rendered the way production sends it.
 */
describe("renderEmailGallery", () => {
  let gallery: EmailGalleryEntry[];

  beforeAll(async () => {
    gallery = await renderEmailGallery();
  });

  const entryFor = (kind: string) => gallery.find((entry) => entry.kind === kind)!;
  const renderOf = (kind: string, locale: string) =>
    entryFor(kind).renders.find((render) => render.locale === locale)!;

  test("shows every account email kind, in order", () => {
    expect(gallery.map((entry) => entry.kind)).toEqual(ACCOUNT_EMAIL_KINDS);
  });

  test("renders each kind in every locale", () => {
    for (const entry of gallery) {
      expect(entry.renders.map((render) => render.locale)).toEqual(routing.locales);
    }
  });

  test("renders each email in its own locale, with the subject production sends", () => {
    const spanishVerification = renderOf("verify-email", "es");

    expect(spanishVerification.html).toContain('lang="es"');
    expect(spanishVerification.html).toContain(es.Emails.VerifyEmail.heading);
    expect(spanishVerification.subject).toBe(es.Emails.VerifyEmail.subject);
  });

  test("serves each render from its own path", () => {
    expect(renderOf("reset-password", "pt").path).toBe("/emails/reset-password.pt.html");
  });

  test.each(routing.locales)("fills the address a change-email names, in %s", (locale) => {
    const { html } = renderOf("change-email", locale);

    expect(html).toContain(SAMPLE_NEW_EMAIL);
    expect(html).not.toContain("{newEmail}");
  });
});

describe("writeEmailGallery", () => {
  const entries: EmailGalleryEntry[] = [
    {
      kind: "verify-email",
      renders: [
        {
          locale: "en",
          subject: "Confirm",
          path: "/emails/verify-email.en.html",
          html: "<p>en</p>",
        },
        {
          locale: "es",
          subject: "Confirma",
          path: "/emails/verify-email.es.html",
          html: "<p>es</p>",
        },
      ],
    },
  ];

  test("writes each render's HTML where its path points, under the portal's public folder", () => {
    const portalDir = mkdtempSync(path.join(tmpdir(), "email-gallery-"));

    writeEmailGallery(entries, portalDir);

    expect(readdirSync(path.join(portalDir, "public/emails")).sort()).toEqual([
      "verify-email.en.html",
      "verify-email.es.html",
    ]);
    expect(readFileSync(path.join(portalDir, "public/emails/verify-email.es.html"), "utf8")).toBe(
      "<p>es</p>",
    );
  });

  test("writes a manifest of what it rendered, without the HTML", () => {
    const portalDir = mkdtempSync(path.join(tmpdir(), "email-gallery-"));

    writeEmailGallery(entries, portalDir);

    const manifest = JSON.parse(
      readFileSync(path.join(portalDir, "src/email-gallery.json"), "utf8"),
    );
    expect(manifest).toEqual([
      {
        kind: "verify-email",
        renders: [
          { locale: "en", subject: "Confirm", path: "/emails/verify-email.en.html" },
          { locale: "es", subject: "Confirma", path: "/emails/verify-email.es.html" },
        ],
      },
    ]);
  });
});
