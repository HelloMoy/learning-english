import { LEGAL_LAST_UPDATED, LegalDocument } from "@/components/legal-document/legal-document";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { legalSections, TERMS_SECTION_KEYS } from "@/lib/legal-sections/legal-sections";

import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Legal.terms" });
  return { title: t("title"), description: t("description") };
}

/**
 * The terms of service. Public and session-free, for the same reason as the
 * privacy policy: they are read before anyone has an account.
 */
export default function TermsPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Legal.terms");

  return (
    <LegalDocument
      title={t("title")}
      intro={t("intro")}
      sections={legalSections(t, TERMS_SECTION_KEYS)}
      lastUpdated={LEGAL_LAST_UPDATED}
    />
  );
}
