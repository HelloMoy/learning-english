import { INSTALL_STEPS } from "@/components/add-to-home-screen-guide/install-steps/install-steps";

import en from "./en.json";
import es from "./es.json";
import pt from "./pt.json";

/**
 * Guards the `course-vocabulary` capability.
 *
 * The bug this change fixes was a vocabulary bug: "episode" denoted a Module
 * on the course overview and a Lesson on the module overview, so a learner
 * who opened "episode 3" landed on a list restarting at "Episode 1". Nothing
 * in the type system stops that from coming back — a single message value is
 * all it takes. These tests are the thing that does.
 */

const CATALOGUES = { en, es, pt } as const;

/** Flatten a nested message object into dot-separated key paths. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** Every string value in a catalogue, regardless of nesting. */
function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value).flatMap(stringValues);
}

describe("message catalogues", () => {
  it("define an identical key set across every locale", () => {
    const [reference, ...others] = Object.entries(CATALOGUES);
    if (!reference) throw new Error("no catalogues to compare");
    const [referenceLocale, referenceMessages] = reference;
    const referenceKeys = keyPaths(referenceMessages).sort();

    for (const [locale, messages] of others) {
      const keys = keyPaths(messages).sort();
      const missing = referenceKeys.filter((key) => !keys.includes(key));
      const extra = keys.filter((key) => !referenceKeys.includes(key));
      expect(
        { locale, missing, extra },
        `${locale}.json drifted from ${referenceLocale}.json`,
      ).toEqual({ locale, missing: [], extra: [] });
    }
  });

  it.each(Object.entries(CATALOGUES))(
    "%s carries no retired season or episode vocabulary",
    (_locale, messages) => {
      // Matches the English, Spanish and Portuguese forms of both retired
      // terms. `Temporada` and `Episódio` are the es/pt renderings that the
      // old catalogues shipped.
      const retired = /\b(season|temporada|episode|episodio|episódio)s?\b/i;
      const offenders = stringValues(messages).filter((value) => retired.test(value));
      expect(offenders).toEqual([]);
    },
  );

  /**
   * Guards the `site-metadata` capability's "sharing copy is localized"
   * requirement. Key parity across locales is already covered above; this is
   * the one string in the namespace that must NOT be translated — it is the
   * brand the wordmark renders, and `og:site_name` has to agree with it in
   * every locale.
   */
  it("keeps the brand name identical in every locale", () => {
    const names = Object.values(CATALOGUES).map((messages) => messages.Metadata.siteName);
    expect(new Set(names)).toEqual(new Set(["English Course"]));
  });

  /**
   * Guards the enlarged-video hint's single direction.
   *
   * The hint carries direction in several places at once — an upward arrow, an
   * upward entrance, upward travel, and the words. They have to agree, and the
   * words are the one part a translator can change without seeing the arrow.
   * A verb of scrolling is the specific way they come apart: it names the page,
   * which travels the opposite way to the finger the arrow points for.
   *
   * This is the only place the copy can be read under every locale. The
   * component's own test mocks `next-intl`, so it renders its fixture and never
   * opens a catalogue.
   */
  it.each(Object.entries(CATALOGUES))("%s moves the video, never the page", (_locale, m) => {
    // Normalized first: `Desplázate` and `desplaza` are the same verb, and only
    // the stripped form lets one pattern catch both.
    const withoutDiacritics = (value: string) =>
      value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const scrollVerbs = /\b(scroll|baja|baje|desplaza|role|rola)/i;

    const hint = (m as typeof en).Components.ScrollDownHint;
    const offenders = [hint.message, hint.screenReaderMessage].filter((line) =>
      scrollVerbs.test(withoutDiacritics(line)),
    );

    expect(offenders).toEqual([]);
  });

  /**
   * Guards the install guide against a step whose copy nobody wrote.
   *
   * Key parity above only says the locales agree with each other; three
   * catalogues can agree perfectly on a key that no step names, or miss one
   * that every step does. The guide renders `t(messageKey)` and `t(targetKey)`
   * for whatever {@link INSTALL_STEPS} holds, so reading the expectation from
   * that array is what makes this survive the next tap iOS adds.
   */
  it.each(Object.entries(CATALOGUES))("%s names every install step", (_locale, m) => {
    const guide = (m as typeof en).Components.AddToHomeScreenGuide as Record<string, string>;
    const required = INSTALL_STEPS.flatMap((step) => [step.messageKey, step.targetKey]);

    const unwritten = required.filter((key) => !guide[key]);

    expect(unwritten).toEqual([]);
  });

  it.each(Object.entries(CATALOGUES))("%s exposes the course vocabulary keys", (_locale, m) => {
    const overview = (m as typeof en).CourseCatalog.courseOverview;
    expect(Object.keys(overview)).toEqual(
      expect.arrayContaining([
        "moduleOrdinal",
        "videoCount",
        "durationMinutes",
        "durationHours",
        "durationHoursMinutes",
        "moduleMeta",
        "viewVideos",
        "remainingVideos",
        "moduleListLabel",
      ]),
    );
  });
});
