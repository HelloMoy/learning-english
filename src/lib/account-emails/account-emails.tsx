import type { EmailMessage } from "@/adapters/email/email-sender";
import ChangeEmail from "@/emails/change-email/change-email";
import DeleteAccount from "@/emails/delete-account/delete-account";
import PasswordChanged from "@/emails/password-changed/password-changed";
import ResetPassword from "@/emails/reset-password/reset-password";
import VerifyEmail from "@/emails/verify-email/verify-email";
import { routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";

import { createTranslator, hasLocale } from "next-intl";
import { render, toPlainText } from "react-email";

/**
 * Which account email to write. Each kind has a template and an
 * `Emails.<Template>` message namespace.
 *
 * @category Email
 */
export type AccountEmailKind =
  "verify-email" | "reset-password" | "delete-account" | "change-email" | "password-changed";

/**
 * The values an email's copy interpolates, such as the address a change-email
 * approval names.
 *
 * @category Email
 */
export type AccountEmailValues = Readonly<Record<string, string>>;

/**
 * A rendered email, minus its recipient.
 *
 * @category Email
 */
export type ComposedEmail = Omit<EmailMessage, "to">;

type AppLocale = (typeof routing.locales)[number];

const MESSAGES = { en, es, pt } satisfies Record<AppLocale, unknown>;

const TEMPLATES = {
  "verify-email": { template: VerifyEmail, namespace: "Emails.VerifyEmail" },
  "reset-password": { template: ResetPassword, namespace: "Emails.ResetPassword" },
  "delete-account": { template: DeleteAccount, namespace: "Emails.DeleteAccount" },
  "change-email": { template: ChangeEmail, namespace: "Emails.ChangeEmail" },
  "password-changed": { template: PasswordChanged, namespace: "Emails.PasswordChanged" },
} as const;

const COPY_KEYS = ["preview", "heading", "body", "button", "linkIntro", "ignore"] as const;

/**
 * The locale an account email must be written in, read from the link it
 * carries.
 *
 * @remarks
 * Better Auth runs the email callbacks without any request locale, but every
 * account form passes a locale-qualified `callbackURL` (`/es/learning`,
 * `/es/reset-password`), and Better Auth copies it into the link. The first
 * segment of that path is the locale the learner acted in.
 *
 * An email whose link points straight at a page rather than at the auth API —
 * the password-changed notice, which opens `/es/forgot-password` — carries no
 * `callbackURL` at all. Its own path already spells the locale, so that is
 * read next. A `/api/auth/...` link falls past it, `api` being no locale.
 *
 * @param actionUrl - The link the email delivers
 * @returns That locale, or the default locale when none can be read
 */
export function localeFromActionUrl(actionUrl: string): AppLocale {
  return (
    localeOfPath(callbackPathOf(actionUrl)) ??
    localeOfPath(appPathOf(actionUrl)) ??
    routing.defaultLocale
  );
}

function localeOfPath(path: string | null): AppLocale | undefined {
  const firstSegment = path?.split("/")[1];
  return hasLocale(routing.locales, firstSegment) ? firstSegment : undefined;
}

/**
 * Renders an account email in the locale its link carries.
 *
 * @param kind - Which email to write
 * @param actionUrl - The link the email delivers
 * @param values - What the copy interpolates, such as `newEmail`
 * @returns The subject, the HTML body and its plain-text alternative
 */
export async function composeAccountEmail(
  kind: AccountEmailKind,
  actionUrl: string,
  values: AccountEmailValues = {},
): Promise<ComposedEmail> {
  const locale = localeFromActionUrl(actionUrl);
  const { template: Template, namespace } = TEMPLATES[kind];
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace });
  const copy = Object.fromEntries(COPY_KEYS.map((key) => [key, t(key, values)])) as Record<
    (typeof COPY_KEYS)[number],
    string
  >;

  const html = await render(
    <Template
      lang={locale}
      copy={copy}
      url={actionUrl}
    />,
  );
  return { subject: t("subject", values), html, text: toPlainText(html) };
}

function callbackPathOf(actionUrl: string): string | null {
  try {
    return new URL(actionUrl).searchParams.get("callbackURL");
  } catch {
    return null;
  }
}

/** The link's own path, which for a link into the app already names the locale. */
function appPathOf(actionUrl: string): string | null {
  try {
    return new URL(actionUrl).pathname;
  } catch {
    return null;
  }
}
