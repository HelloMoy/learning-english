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
