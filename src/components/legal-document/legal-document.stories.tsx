import {
  legalSections,
  PRIVACY_SECTION_KEYS,
  TERMS_SECTION_KEYS,
} from "@/lib/legal-sections/legal-sections";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { LEGAL_LAST_UPDATED, LegalDocument } from "./legal-document";

/**
 * Stories for `<LegalDocument />`, the shell the privacy policy and the terms
 * share.
 *
 * Both stories render the **real** published wording from the `Legal`
 * namespace rather than sample copy, because the text is the thing under
 * review: use the locale toolbar to read the whole policy in `en`, `es` and
 * `pt`, and the theme toolbar to check the prose column in both.
 */
// Annotated rather than `satisfies`, because every story builds its props
// inside `render` — the copy comes from `useTranslations`, which cannot be
// called at module scope to fill `args`. Several stories in this repo take the
// same form for the same reason.
const meta: Meta<typeof LegalDocument> = {
  title: "Components/LegalDocument",
  component: LegalDocument,
};

export default meta;
type Story = StoryObj<typeof LegalDocument>;

function PrivacyPolicy() {
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

function TermsOfService() {
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

/** The published privacy policy, exactly as `/[locale]/privacy` renders it. */
export const Privacy: Story = {
  render: () => <PrivacyPolicy />,
};

/** The published terms, exactly as `/[locale]/terms` renders it. */
export const Terms: Story = {
  render: () => <TermsOfService />,
};

/**
 * The privacy policy locked to Spanish — the date format is the part that
 * differs invisibly until you compare two locales side by side.
 */
export const PrivacyInSpanish: Story = {
  parameters: { locale: "es" },
  render: () => <PrivacyPolicy />,
};

/** The privacy policy locked to Portuguese. */
export const PrivacyInPortuguese: Story = {
  parameters: { locale: "pt" },
  render: () => <PrivacyPolicy />,
};
