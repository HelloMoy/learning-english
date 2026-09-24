import { INSTALL_STEPS } from "@/components/add-to-home-screen-guide/install-steps/install-steps";
import {
  SAFARI_INSTALL_RESULT,
  SAFARI_INSTALL_STEPS,
} from "@/components/safari-install-guide/safari-install-steps/safari-install-steps";
import { PRIVACY_SECTION_KEYS, TERMS_SECTION_KEYS } from "@/lib/legal-sections/legal-sections";

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

  /**
   * Guards the iPad and macOS guides against a step whose copy nobody wrote.
   *
   * Key parity above only says the locales agree with each other; three
   * catalogues can agree perfectly on a key that no step names, or miss one that
   * every step does. The guides render `t(messageKey)` for whatever
   * {@link SAFARI_INSTALL_STEPS} holds, so reading the expectation from that
   * table is what makes this survive the next tap Apple adds.
   */
  it.each(Object.entries(CATALOGUES))("%s names every Safari install step", (_locale, m) => {
    const guide = (m as typeof en).Components.SafariInstallGuide as Record<string, string>;
    const controls = (m as typeof en).Components.AddToHomeScreenGuide as Record<string, string>;
    const platforms = ["ipad", "mac"] as const;

    const unwritten = platforms.flatMap((platform) => [
      ...SAFARI_INSTALL_STEPS[platform].flatMap((step) => [
        guide[step.messageKey] ? [] : [`${platform}: ${step.messageKey}`],
        controls[step.targetKey] ? [] : [`${platform}: ${step.targetKey}`],
      ]),
      guide[SAFARI_INSTALL_RESULT[platform].messageKey]
        ? []
        : [`${platform}: ${SAFARI_INSTALL_RESULT[platform].messageKey}`],
    ]);

    expect(unwritten.flat()).toEqual([]);
  });

  /**
   * Guards the macOS guide against the home screen a Mac does not have.
   *
   * A Mac has a Dock. Telling that learner the course will sit on their "home
   * screen" names a place they cannot go and look at — the same failure as
   * naming a control that is not on their screen, and the one part of the guide
   * a translator can get wrong without seeing the platform.
   */
  it.each(Object.entries(CATALOGUES))("%s keeps the home screen off the Mac", (_locale, m) => {
    const withoutDiacritics = (value: string) =>
      value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const homeScreen = /\b(home screen|pantalla de inicio|tela de inicio|ecra de inicio)\b/i;

    const guide = (m as typeof en).Components.SafariInstallGuide as Record<string, string>;
    const macCopy = Object.entries(guide)
      .filter(([key]) => key.startsWith("mac"))
      .map(([, value]) => value);

    const offenders = macCopy.filter((line) => homeScreen.test(withoutDiacritics(line)));

    expect(offenders).toEqual([]);
  });

  /**
   * Guards the desktop prompt's claim against its own picture.
   *
   * The prompt draws the application switcher, which argues from **presence**:
   * the course among the learner's other applications. Copy that argues from the
   * absence of tabs describes a different drawing — and an absence the learner
   * cannot check until after they have decided.
   */
  it.each(Object.entries(CATALOGUES))("%s argues the desktop prompt from presence", (_l, m) => {
    const withoutDiacritics = (value: string) =>
      value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const switching = /\b(applications?|aplicacion|aplicac|aplicativ)/i;

    const body = (m as typeof en).Components.InstallPrompt.desktop.body;

    expect(switching.test(withoutDiacritics(body))).toBe(true);
  });

  /**
   * Guards the guide's control rail, which all three guides share.
   *
   * It is the only way to move a guide that does not require discovering a
   * gesture first, so a missing name here leaves a learner with an unlabelled
   * button and no other route.
   */
  it.each(Object.entries(CATALOGUES))("%s names every guide control", (_locale, m) => {
    const rail = (m as typeof en).Components.GuidePlaybackRail as Record<string, string>;
    const required = ["previous", "next", "goToStep", "goToResult"];

    const unwritten = required.filter((key) => !rail[key]);

    expect(unwritten).toEqual([]);
  });

  /**
   * Guards the install prompt's two wordings.
   *
   * The prompt says "add to your home screen" on a handheld and "install" on a
   * desktop, because those are the words each platform's own browser uses. Key
   * parity above only says the locales agree with each other, so all three can
   * agree on half a namespace.
   */
  it.each(Object.entries(CATALOGUES))("%s writes both install-prompt wordings", (_locale, m) => {
    const prompt = (m as typeof en).Components.InstallPrompt;
    const required = [
      "dialogTitle",
      "dismiss",
      "handheld.title",
      "handheld.body",
      "handheld.confirm",
      "desktop.title",
      "desktop.body",
      "desktop.confirm",
    ];

    const unwritten = required.filter((key) => !keyPaths(prompt).includes(key));

    expect(unwritten).toEqual([]);
  });

  /**
   * Guards the desktop wording against the home screen it does not have.
   *
   * A desktop has a dock or a taskbar. Telling that learner the course will sit
   * on their "home screen" names a place they cannot go and look at — the same
   * failure as the guide naming an iOS control that is not on the phone. The
   * words are the one part a translator can change without seeing the platform.
   */
  it.each(Object.entries(CATALOGUES))("%s keeps the home screen off the desktop", (_locale, m) => {
    const withoutDiacritics = (value: string) =>
      value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const homeScreen = /\b(home screen|pantalla de inicio|tela de inicio|ecra de inicio)\b/i;

    const desktop = (m as typeof en).Components.InstallPrompt.desktop;
    const offenders = stringValues(desktop).filter((line) =>
      homeScreen.test(withoutDiacritics(line)),
    );

    expect(offenders).toEqual([]);
  });

  /**
   * Guards both legal documents against a passage nobody wrote.
   *
   * Key parity above only says the locales agree with each other; three
   * catalogues can agree perfectly on a section no document names, or miss one
   * that every document renders. The pages walk the key tuples and call
   * `t(`sections.${key}.heading`)`, so reading the expectation from those
   * tuples is what makes this survive the next section someone adds.
   */
  it.each(Object.entries(CATALOGUES))("%s writes every legal passage", (_locale, m) => {
    const legal = (m as typeof en).Legal;
    const documents = [
      { sections: legal.privacy.sections, keys: PRIVACY_SECTION_KEYS },
      { sections: legal.terms.sections, keys: TERMS_SECTION_KEYS },
    ] as const;

    const unwritten = documents.flatMap(({ sections, keys }) =>
      keys
        .map((key) => (sections as Record<string, { heading?: string; body?: string }>)[key])
        .flatMap((section, index) =>
          section?.heading && section.body ? [] : [`${index}: missing heading or body`],
        ),
    );

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
        "courseMetaShort",
        "timeLeft",
        "watchAgain",
        "percentComplete",
        "completedOfTotal",
        "continueWhereLeftOff",
        "statusCompleted",
        "statusInProgress",
        "statusNotStarted",
        "lessonTally",
        "allWatchedShort",
        "openLessonTile",
        "videoPosition",
      ]),
    );
  });
});
