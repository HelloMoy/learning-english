import { LEGAL_LAST_UPDATED, LegalDocument } from "@/components/legal-document/legal-document";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { legalSections, PRIVACY_SECTION_KEYS } from "@/lib/legal-sections/legal-sections";

import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Legal.privacy" });
  return { title: t("title"), description: t("description") };
}

/**
 * The privacy policy. Public and session-free: an anonymous reader — and
 * Google's OAuth consent screen, which will not publish without fetching it —
 * has to be able to reach it.
 */
export default function PrivacyPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Legal.privacy");

  return (
    <LegalDocument
      title={t("title")}
      intro={t("intro")}
      sections={legalSections(t, PRIVACY_SECTION_KEYS)}
      lastUpdated={LEGAL_LAST_UPDATED}
    />
  );
}
