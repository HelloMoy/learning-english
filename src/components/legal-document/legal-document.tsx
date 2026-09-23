import type { LegalSection } from "@/lib/legal-sections/legal-sections";

import { useFormatter, useTranslations } from "next-intl";

/**
 * When the legal text last changed.
 *
 * @remarks
 * A constant rather than `new Date()`: the right value is the day the wording
 * was edited, which is editorial and belongs in the source. Reading the clock
 * here would also break static rendering, which the project forbids in Server
 * Components. Edit the prose, edit this.
 *
 * @category Legal
 */
export const LEGAL_LAST_UPDATED = new Date("2026-09-22T00:00:00Z");

/**
 * Everything {@link LegalDocument} renders.
 *
 * @category Legal
 */
export type LegalDocumentProps = {
  /** The document's name, rendered as the page's only first-level heading. */
  title: string;
  /** The opening paragraph, before the first section. */
  intro: string;
  /** The passages, rendered in the order given — reading order is meaning. */
  sections: readonly LegalSection[];
  /** When the wording last changed; formatted for the active locale. */
  lastUpdated: Date;
};

/**
 * The shell both legal pages share: a title, an opening paragraph, a series of
 * titled passages, and the date the wording last changed.
 *
 * @remarks
 * Presentational and locale-agnostic — every string arrives already resolved,
 * so the same component renders the privacy policy and the terms. The one
 * thing it looks up itself is the "last updated" label, because the date beside
 * it has to be formatted for the active locale rather than interpolated as a
 * fixed string.
 *
 * @example
 * ```tsx
 * <LegalDocument
 *   title={t("privacy.title")}
 *   intro={t("privacy.intro")}
 *   sections={sections}
 *   lastUpdated={LEGAL_LAST_UPDATED}
 * />
 * ```
 *
 * @param props - The document's title, intro, passages and revision date
 * @returns The page's `main` landmark, holding the rendered document
 *
 * @category Legal
 */
export function LegalDocument({ title, intro, sections, lastUpdated }: LegalDocumentProps) {
  const t = useTranslations("Legal");
  const format = useFormatter();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-11 sm:py-20"
    >
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{title}</h1>
        <p className="text-lg text-muted-foreground">{intro}</p>
      </header>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section
            key={section.heading}
            className="flex flex-col gap-3"
          >
            <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
            <p className="leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <p
        data-testid="legal-last-updated"
        className="border-t border-border pt-6 text-sm text-muted-foreground"
      >
        {t("lastUpdated", {
          // Fixed zone: the constant is an editorial date, not an instant.
          // Formatted in the reader's own zone it slips a day for everyone west
          // of UTC, so two readers would cite different versions of one text.
          date: format.dateTime(lastUpdated, {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          }),
        })}
      </p>
    </main>
  );
}
