/**
 * The passages of the privacy policy, in reading order.
 *
 * @remarks
 * A literal tuple rather than something derived from the message catalogue at
 * runtime: reading order is the document's meaning, and a key with no
 * translation should be a type error and a failing test, not an empty section
 * discovered in production. `messages.test.ts` checks every key here resolves
 * in every locale.
 *
 * @category Legal
 */
export const PRIVACY_SECTION_KEYS = [
  "whatThisCovers",
  "account",
  "learning",
  "email",
  "botProtection",
  "errorReports",
  "cookies",
  "yourChoices",
  "contact",
] as const;

/**
 * The passages of the terms of service, in reading order.
 *
 * @see PRIVACY_SECTION_KEYS for why this is a literal tuple.
 *
 * @category Legal
 */
export const TERMS_SECTION_KEYS = [
  "whatThisCovers",
  "yourAccount",
  "courseContent",
  "acceptableUse",
  "availability",
  "endingYourAccount",
  "changes",
  "contact",
] as const;

/**
 * A passage key of either legal document.
 *
 * @category Legal
 */
export type LegalSectionKey =
  (typeof PRIVACY_SECTION_KEYS)[number] | (typeof TERMS_SECTION_KEYS)[number];

/**
 * One titled passage of a legal document, already translated.
 *
 * @category Legal
 */
export type LegalSection = {
  /** The passage's heading. */
  heading: string;
  /** The passage itself, one paragraph. */
  body: string;
};

/** Resolves a message key inside a document's `Legal.<document>` namespace. */
type SectionTranslator = (key: string) => string;

/**
 * Resolves a document's passages, in the order its key tuple declares.
 *
 * @example
 * ```ts
 * const t = useTranslations("Legal.privacy");
 * const sections = legalSections(t, PRIVACY_SECTION_KEYS);
 * ```
 *
 * @param translate - A translator scoped to the document's namespace
 * @param keys - The document's passage keys, in reading order
 * @returns The translated passages, ready for `LegalDocument`
 *
 * @category Legal
 */
export function legalSections(
  translate: SectionTranslator,
  keys: readonly LegalSectionKey[],
): LegalSection[] {
  return keys.map((key) => ({
    heading: translate(`sections.${key}.heading`),
    body: translate(`sections.${key}.body`),
  }));
}
