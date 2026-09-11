/**
 * The iOS surface a step acts on, and so the one the guide depicts for it.
 *
 * @category Components
 */
export type InstallStepSurface =
  | "safari-bar"
  | "more-menu"
  | "share-sheet-collapsed"
  | "share-sheet"
  | "confirm-sheet"
  | "home-screen";

/**
 * One tap of the install flow.
 *
 * @remarks
 * `messageKey` and `targetKey` are both read from
 * `Components.AddToHomeScreenGuide`. They are separate because the instruction
 * is a sentence and the target is the bare control label — the same label the
 * mock screen paints, so the two can never name different controls.
 *
 * @category Components
 */
export type InstallStep = {
  /** Key of the sentence telling the learner what to do. */
  messageKey: string;
  /** Key of the iOS control's own label, in the learner's locale. */
  targetKey: string;
  /** Which iOS surface this step happens on. */
  surface: InstallStepSurface;
};

/**
 * Adding the course to an iPhone home screen, as iOS 26 Safari requires it.
 *
 * @remarks
 * Taken from a screen recording of the real device, not from memory, and it
 * contradicts the flow everyone remembers twice:
 *
 * - iOS 26's bottom bar is a back circle, an address pill and a "···" circle,
 *   with **no** share glyph. So the flow begins at "···", and a guide that
 *   starts at a share icon sends the learner looking for a control that is not
 *   on their screen.
 * - The sheet "Share" opens is **collapsed**: a header, an app row, and a row
 *   of round actions ending in "View More". "Add to Home Screen" is not on it.
 *   Only "View More" puts it there, which is why that tap is a step of its own
 *   rather than something the next step's wording can absorb.
 *
 * Five taps, then.
 *
 * `GuideAutoplay` walks this array. It stayed a separate module after the second
 * guide variant was deleted, because it is the one place the flow itself is
 * written down — the instruction text, the mock screen and the order all read
 * from here.
 *
 * @category Components
 */
export const INSTALL_STEPS: readonly InstallStep[] = [
  { messageKey: "stepMore", targetKey: "iosMore", surface: "safari-bar" },
  { messageKey: "stepShare", targetKey: "iosShare", surface: "more-menu" },
  {
    messageKey: "stepViewMore",
    targetKey: "iosViewMore",
    surface: "share-sheet-collapsed",
  },
  {
    messageKey: "stepAddToHomeScreen",
    targetKey: "iosAddToHomeScreen",
    surface: "share-sheet",
  },
  { messageKey: "stepAdd", targetKey: "iosAdd", surface: "confirm-sheet" },
] as const;

/**
 * What the taps buy: the course's icon on the home screen.
 *
 * @remarks
 * Deliberately not an {@link InstallStep}. The learner taps nothing here, so it
 * carries no `targetKey`, and counting it as another step would overstate how
 * much work the flow takes. A guide that stops at the confirmation screen asks
 * for four taps and never shows what they were for.
 *
 * @category Components
 */
export const INSTALL_RESULT: InstallResult = {
  messageKey: "result",
  surface: "home-screen",
};

/**
 * The outcome of the flow: a screen to show, with nothing to tap on it.
 *
 * @category Components
 */
export type InstallResult = {
  /** Key of the sentence describing what the learner now has. */
  messageKey: string;
  surface: "home-screen";
};

/**
 * Anything the guide can put on its mock phone — a tap to perform, or the
 * result of having performed them all.
 *
 * @category Components
 */
export type GuideFrame = InstallStep | InstallResult;
