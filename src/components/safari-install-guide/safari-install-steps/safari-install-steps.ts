/**
 * The two Safari platforms that need a guide rather than a button.
 *
 * @remarks
 * The iPhone is not one of them. Its flow starts somewhere else, on surfaces of
 * a different shape, and it has its own module — see `install-steps.ts`.
 *
 * @category Components
 */
export type SafariPlatform = "ipad" | "mac";

/**
 * The Safari surface a step acts on, and so the one the guide depicts for it.
 *
 * @remarks
 * `share-popover-collapsed` is an iPad surface only. A Mac's popover opens with
 * its whole list showing, so there is no half-open state to depict and no tap
 * that opens one.
 *
 * @category Components
 */
export type SafariStepSurface = "toolbar" | "share-popover-collapsed" | "share-popover" | "confirm";

/**
 * One tap of a Safari install flow.
 *
 * @remarks
 * `messageKey` and `targetKey` are separate because the instruction is a
 * sentence and the target is the bare control label — the same label the
 * depiction paints, so the two can never name different controls. The sentences
 * live in `Components.SafariInstallGuide`; the control labels live with every
 * other OS control label in `Components.AddToHomeScreenGuide`.
 *
 * @category Components
 */
export type SafariInstallStep = {
  /** Key of the sentence telling the learner what to do. */
  messageKey: string;
  /** Key of the Safari control's own label, in the learner's locale. */
  targetKey: string;
  /** Which Safari surface this step happens on. */
  surface: SafariStepSurface;
};

/**
 * What the taps buy: a screen to show, with nothing to act on.
 *
 * @category Components
 */
export type SafariInstallResult = {
  /** Key of the sentence describing what the learner now has. */
  messageKey: string;
  /** Where the icon comes to rest on this platform. */
  surface: "home-screen" | "dock";
};

/**
 * Anything a Safari guide can put on its depiction — a tap to perform, or the
 * result of having performed them all.
 *
 * @category Components
 */
export type SafariGuideFrame = SafariInstallStep | SafariInstallResult;

/**
 * Whether this frame is a tap the learner performs, or the result of having
 * performed them all.
 *
 * @remarks
 * The two are told apart by the target, because that is the actual difference:
 * a step names a control to act on and a result names none. Narrowing on the
 * surface instead would mean re-listing every surface each time a platform
 * gains one.
 *
 * @param frame - The frame to classify
 * @returns `true` when the frame carries a control to act on
 * @category Components
 */
export const isSafariInstallStep = (frame: SafariGuideFrame): frame is SafariInstallStep =>
  "targetKey" in frame;

/**
 * Adding the course to an iPad home screen and to a Mac Dock, as Safari 26
 * requires it.
 *
 * @remarks
 * Both were captured from the real thing — the iPad from the iPadOS 26.5
 * simulator and confirmed against a recording of a device, the Mac from Safari
 * 26.6.2 and likewise — rather than written from memory. Two things that catches:
 *
 * - **The iPad's share popover opens collapsed.** It carries a site header, an
 *   app row, and a row of round actions ending in "View More", and no list at
 *   all. "Add to Home Screen" is not on it until that tap, which is why that tap
 *   is a step of its own rather than something the next step's wording absorbs.
 * - **The Mac's popover does not.** It opens with the whole list showing, "Add
 *   to Dock" fifth. Copying the iPad's expanding step onto the Mac would invent
 *   a control the learner's popover does not carry — the same failure, mirrored.
 *
 * Neither flow begins at a share glyph in a bottom bar. That is the iPhone's,
 * and on both of these Safari puts share in the toolbar.
 *
 * `SafariGuideAutoplay` walks these. This is the one place the flows are written
 * down: the instruction text, the depicted surface and the order all read from
 * here.
 *
 * @category Components
 */
export const SAFARI_INSTALL_STEPS: Readonly<Record<SafariPlatform, readonly SafariInstallStep[]>> =
  {
    ipad: [
      { messageKey: "ipadStepShare", targetKey: "iosShare", surface: "toolbar" },
      {
        messageKey: "ipadStepViewMore",
        targetKey: "iosViewMore",
        surface: "share-popover-collapsed",
      },
      {
        messageKey: "ipadStepAddToHomeScreen",
        targetKey: "iosAddToHomeScreen",
        surface: "share-popover",
      },
      { messageKey: "ipadStepAdd", targetKey: "iosAdd", surface: "confirm" },
    ],
    mac: [
      { messageKey: "macStepShare", targetKey: "iosShare", surface: "toolbar" },
      { messageKey: "macStepAddToDock", targetKey: "macAddToDock", surface: "share-popover" },
      { messageKey: "macStepAdd", targetKey: "iosAdd", surface: "confirm" },
    ],
  } as const;

/**
 * Where the icon comes to rest on each platform.
 *
 * @remarks
 * Deliberately not a {@link SafariInstallStep}. The learner acts on nothing
 * here, so it carries no `targetKey`, and counting it as another step would
 * overstate how much work the flow takes. A guide that stops at the
 * confirmation asks for taps and never shows what they were for.
 *
 * A Mac has no home screen, which is why the two differ: one ends on the home
 * screen and the other in the Dock.
 *
 * @category Components
 */
export const SAFARI_INSTALL_RESULT: Readonly<Record<SafariPlatform, SafariInstallResult>> = {
  ipad: { messageKey: "ipadResult", surface: "home-screen" },
  mac: { messageKey: "macResult", surface: "dock" },
} as const;
