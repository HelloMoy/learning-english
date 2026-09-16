/** Every prize a module can redeem, including the gift box for uncatalogued modules. */
export const PRIZE_IDS = [
  "whistle",
  "harmonica",
  "megaphone",
  "drum",
  "car",
  "microphone",
  "kazoo",
  "spring",
  "kaleidoscope",
  "yoyo",
  "top",
  "walkie",
  "tinphone",
  "crown",
  "robot",
  "gift",
] as const;

/** One prize from the arcade counter. */
export type PrizeId = (typeof PRIZE_IDS)[number];

/**
 * The prize each module redeems, keyed by module slug. Each toy echoes what its
 * module practises: sustained vowels are a harmonica, intonation rises and falls
 * like a yo-yo, contractions compress like a spring.
 */
const PRIZE_BY_MODULE_SLUG: Readonly<Record<string, PrizeId>> = {
  "1-introduction": "whistle",
  "2-vowels": "harmonica",
  "3-consonants": "megaphone",
  "4-ejercicios-para-dominar-el-ritmo-en-ingles": "drum",
  "5-fluidez-y-velocidad": "car",
  "1-advanced-pronunciation-course": "microphone",
  "2-advanced-vowel-pronunciation-in-american-english": "kazoo",
  "3-contractions-reductions": "spring",
  "4-key-sound-patterns-and-features": "kaleidoscope",
  "5-sound-natural-american-intonation-essentials": "yoyo",
  "6-rules-for-speaking-fast-natural-in-english": "top",
  "7-everyday-english-phrases-part-1-master-them": "walkie",
  "8-everyday-english-phrases-part-2-master-them": "tinphone",
  "9-speak-with-confidence-in-30-days": "crown",
  "10-the-practice-zone-sharpen-your-skills": "robot",
};

/** The module slugs the catalog assigns a prize to. */
export const CATALOGUED_MODULE_SLUGS: ReadonlyArray<string> = Object.keys(PRIZE_BY_MODULE_SLUG);

/**
 * The prize a module redeems once every one of its lessons has earned its ticket.
 *
 * @remarks
 * The table lives in code rather than in course content because the prize is a
 * product decision, not course data. A module the table does not know — a new or
 * renamed module folder — still has something to redeem: the gift box.
 *
 * @example
 * ```ts
 * prizeForModule("2-vowels"); // "harmonica"
 * prizeForModule("11-bonus"); // "gift"
 * ```
 *
 * @param moduleSlug - The module's slug
 * @returns The module's prize, or `gift` when the slug is not catalogued
 */
export function prizeForModule(moduleSlug: string): PrizeId {
  return PRIZE_BY_MODULE_SLUG[moduleSlug] ?? "gift";
}
