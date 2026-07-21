/**
 * Slug normalization for course content folder names.
 *
 * Folder names on disk may contain spaces, `&`, `#`, `:`, accented
 * characters, and other non-URL-safe punctuation. URL keys MUST be
 * kebab-case ASCII; this utility performs the normalization.
 *
 * The transformations are intentionally simple — no Unicode tables, no
 * locale-aware transliteration beyond common Spanish characters. If a
 * folder name does not normalize cleanly (e.g., the author wants a
 * specific slug), list it in `scripts/slug-overrides.ts` instead.
 *
 * Idempotency: `slugify(slugify(x)) === slugify(x)`. Run the output back
 * through `slugify` and it MUST not change.
 */

/**
 * Spanish-friendly ASCII transliteration for common accented vowels and `ñ`.
 * Anything outside this map falls back to `replace(/[^a-z0-9]+/g, "-")`
 * which silently drops unknown characters — that is a deliberate choice
 * because the seed generator has no concept of "unknown character".
 */
const TRANSLITERATIONS: Record<string, string> = {
  á: "a",
  à: "a",
  ä: "a",
  â: "a",
  ã: "a",
  é: "e",
  è: "e",
  ë: "e",
  ê: "e",
  í: "i",
  ì: "i",
  ï: "i",
  î: "i",
  ó: "o",
  ò: "o",
  ö: "o",
  ô: "o",
  õ: "o",
  ú: "u",
  ù: "u",
  ü: "u",
  û: "u",
  ñ: "n",
  ç: "c",
};

/**
 * Returns a URL-safe kebab-case slug derived from `rawName`.
 *
 * Behaviour:
 * 1. Decompose to Unicode NFD and strip combining marks (removes accents
 *    generically — macOS stores filenames decomposed, e.g. "é" = "e" + ´).
 * 2. Lowercase.
 * 3. Replace any residual mapped characters via `TRANSLITERATIONS`.
 * 4. Replace any run of non-alphanumeric characters with a single `-`.
 * 5. Collapse consecutive `-` and trim leading/trailing `-`.
 * 6. If the result is empty, return `"untitled"`.
 */
export function slugify(rawName: string): string {
  const deaccented = rawName.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const lower = deaccented.toLowerCase();
  const transliterated = [...lower].map((ch) => TRANSLITERATIONS[ch] ?? ch).join("");
  const dashed = transliterated.replace(/[^a-z0-9]+/g, "-");
  const collapsed = dashed.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return collapsed.length > 0 ? collapsed : "untitled";
}
