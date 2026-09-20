import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** The account pages, by the `Account.<page>` namespace that titles them. */
type AccountPage = "signIn" | "signUp" | "forgotPassword" | "resetPassword" | "accountDeleted";

const HREF: Record<AccountPage, string> = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  accountDeleted: "/account-deleted",
};

/**
 * The metadata every account page declares: its own title and subtitle, and
 * `noindex, follow` — an account page is nothing a search result should lead to.
 *
 * @param page - Which account page
 * @param locale - The route's locale; an unsupported one is not found
 * @returns The page's metadata
 */
export async function accountPageMetadata(page: AccountPage, locale: string): Promise<Metadata> {
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Account" });
  const meta = await getTranslations({ locale, namespace: "Metadata" });
  const title = t(`${page}.metaTitle`);
  return personalRouteMetadata({
    locale,
    href: HREF[page],
    title,
    description: t(`${page}.subtitle`),
    siteName: meta("siteName"),
    imageAlt: meta("imageAlt", { title }),
  });
}
