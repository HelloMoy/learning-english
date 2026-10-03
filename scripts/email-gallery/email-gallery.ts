import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { routing } from "@/i18n/routing";
import {
  ACCOUNT_EMAIL_KINDS,
  composeAccountEmail,
  type AccountEmailKind,
} from "@/lib/account-emails/account-emails";

/** The address a change-email names in the gallery, standing in for the learner's new one. */
export const SAMPLE_NEW_EMAIL = "ana.g@example.com";

type Locale = (typeof routing.locales)[number];

/** One account email in one locale, as the gallery shows it. */
export type EmailGalleryRender = {
  locale: Locale;
  subject: string;
  /** Root-relative path the portal serves the HTML from. */
  path: string;
  html: string;
};

/** One account email kind with its render in every locale. */
export type EmailGalleryEntry = {
  kind: AccountEmailKind;
  renders: EmailGalleryRender[];
};

/**
 * Renders every account email in every locale through `composeAccountEmail`,
 * so the gallery shows exactly what a learner receives.
 *
 * @returns One entry per kind, in `ACCOUNT_EMAIL_KINDS` order
 */
export async function renderEmailGallery(): Promise<EmailGalleryEntry[]> {
  return Promise.all(
    ACCOUNT_EMAIL_KINDS.map(async (kind) => ({
      kind,
      renders: await Promise.all(routing.locales.map((locale) => renderOne(kind, locale))),
    })),
  );
}

async function renderOne(kind: AccountEmailKind, locale: Locale): Promise<EmailGalleryRender> {
  // `composeAccountEmail` reads the locale from the link's first path segment.
  const sampleLink = `https://english-course.online/${locale}/preview`;
  const { subject, html } = await composeAccountEmail(kind, sampleLink, {
    newEmail: SAMPLE_NEW_EMAIL,
  });

  return { locale, subject, path: `/emails/${kind}.${locale}.html`, html };
}

/**
 * Writes the gallery into the docs portal: each render's HTML under
 * `public/` at its path, and a manifest of the renders — without their HTML —
 * that the portal's Emails page is built from.
 *
 * @param entries - The renders from {@link renderEmailGallery}
 * @param portalDir - The portal project's root, `docs-portal/`
 */
export function writeEmailGallery(entries: EmailGalleryEntry[], portalDir: string): void {
  const publicDir = path.join(portalDir, "public");
  // A kind or locale that was removed must not linger from an earlier run.
  rmSync(path.join(publicDir, "emails"), { recursive: true, force: true });
  mkdirSync(path.join(publicDir, "emails"), { recursive: true });

  for (const { path: renderPath, html } of entries.flatMap((entry) => entry.renders)) {
    writeFileSync(path.join(publicDir, renderPath), html);
  }

  mkdirSync(path.join(portalDir, "src"), { recursive: true });
  writeFileSync(
    path.join(portalDir, "src/email-gallery.json"),
    JSON.stringify(manifestOf(entries)),
  );
}

function manifestOf(entries: EmailGalleryEntry[]) {
  return entries.map(({ kind, renders }) => ({
    kind,
    renders: renders.map(({ locale, subject, path: renderPath }) => ({
      locale,
      subject,
      path: renderPath,
    })),
  }));
}

async function main(): Promise<void> {
  const portalDir = path.resolve(import.meta.dirname, "../../docs-portal");
  const entries = await renderEmailGallery();

  writeEmailGallery(entries, portalDir);
  console.log(`Rendered ${entries.length} account emails into ${portalDir}`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
