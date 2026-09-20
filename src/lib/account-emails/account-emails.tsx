import type { EmailMessage } from "@/adapters/email/email-sender";
import DeleteAccount from "@/emails/delete-account/delete-account";
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
export type AccountEmailKind = "verify-email" | "reset-password" | "delete-account";

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
 * @param actionUrl - The verification or reset link Better Auth built
 * @returns That locale, or the default locale when none can be read
 */
export function localeFromActionUrl(actionUrl: string): AppLocale {
  const callbackPath = callbackPathOf(actionUrl);
  const firstSegment = callbackPath?.split("/")[1];
  return hasLocale(routing.locales, firstSegment) ? firstSegment : routing.defaultLocale;
}

/**
 * Renders an account email in the locale its link carries.
 *
 * @param kind - Which email to write
 * @param actionUrl - The link the email delivers
 * @returns The subject, the HTML body and its plain-text alternative
 */
export async function composeAccountEmail(
  kind: AccountEmailKind,
  actionUrl: string,
): Promise<ComposedEmail> {
  const locale = localeFromActionUrl(actionUrl);
  const { template: Template, namespace } = TEMPLATES[kind];
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace });
  const copy = Object.fromEntries(COPY_KEYS.map((key) => [key, t(key)])) as Record<
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
  return { subject: t("subject"), html, text: toPlainText(html) };
}

function callbackPathOf(actionUrl: string): string | null {
  try {
    return new URL(actionUrl).searchParams.get("callbackURL");
  } catch {
    return null;
  }
}
