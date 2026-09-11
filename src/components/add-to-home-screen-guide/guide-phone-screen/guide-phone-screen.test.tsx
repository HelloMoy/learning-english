import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { INSTALL_RESULT, INSTALL_STEPS } from "../install-steps/install-steps";
import { GuidePhoneScreen } from "./guide-phone-screen";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so a screen painting English iOS labels fails here. */
const MESSAGES: Record<string, string> = {
  iosMore: "···",
  iosShare: "Compartir",
  iosViewMore: "Ver más",
  iosAddToHomeScreen: "Añadir a pantalla de inicio",
  iosAdd: "Añadir",
  iosOpenAsWebApp: "Abrir como app web",
};

const [MORE_STEP, SHARE_STEP, VIEW_MORE_STEP, ADD_TO_HOME_STEP, ADD_STEP] = INSTALL_STEPS;

/**
 * The brand, which `messages.test.ts` pins identical in every locale, so the mock
 * home screen hardcodes it rather than inventing a translation key for it.
 */
const BRAND = "English Course";

describe("GuidePhoneScreen", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN a learner looking for a control on their own phone", () => {
    test.each([
      ["the More control", MORE_STEP, MESSAGES.iosMore],
      ["Share", SHARE_STEP, MESSAGES.iosShare],
      ["View More", VIEW_MORE_STEP, MESSAGES.iosViewMore],
      ["Add to Home Screen", ADD_TO_HOME_STEP, MESSAGES.iosAddToHomeScreen],
      ["Add", ADD_STEP, MESSAGES.iosAdd],
    ])("WHEN the step targets %s THEN the screen paints its localized label", (_, step, label) => {
      render(<GuidePhoneScreen step={step!} />);

      expect(screen.getByText(label!)).toBeInTheDocument();
    });

    test("WHEN rendered THEN its labels come from the guide's own namespace", () => {
      render(<GuidePhoneScreen step={MORE_STEP!} />);

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.AddToHomeScreenGuide");
    });

    test("WHEN the confirmation step is shown THEN the web-app toggle is named too", () => {
      // The step's instruction tells the learner to leave it on, so the screen
      // has to actually show the thing being named.
      render(<GuidePhoneScreen step={ADD_STEP!} />);

      expect(screen.getByText(MESSAGES.iosOpenAsWebApp!)).toBeInTheDocument();
    });
  });

  describe("GIVEN the share sheet opens collapsed and the learner must open it out", () => {
    test.each([
      ["collapsed", VIEW_MORE_STEP],
      ["expanded", ADD_TO_HOME_STEP],
    ])("WHEN the %s sheet is depicted THEN it is the share sheet", (_, step) => {
      // Both states draw the one sheet, so both carry its row of actions. Without
      // this, a surface that fell through to some other screen would still satisfy
      // every assertion below.
      const { container } = render(<GuidePhoneScreen step={step!} />);

      expect(container.querySelector("[data-sheet-actions]")).toBeInTheDocument();
    });

    test("WHEN the collapsed sheet is depicted THEN it carries no list to choose from", () => {
      // The step before this one is the whole reason it exists: on the sheet
      // Share opens there is nothing to scroll, so drawing a list here would
      // make the View More tap look optional.
      const { container } = render(<GuidePhoneScreen step={VIEW_MORE_STEP!} />);

      expect(container.querySelector("[data-sheet-list]")).not.toBeInTheDocument();
    });

    test("WHEN the expanded sheet is depicted THEN the list is there", () => {
      const { container } = render(<GuidePhoneScreen step={ADD_TO_HOME_STEP!} />);

      expect(container.querySelector("[data-sheet-list]")).toBeInTheDocument();
    });

    test.each([
      ["collapsed", VIEW_MORE_STEP],
      ["expanded", ADD_TO_HOME_STEP],
    ])("WHEN the %s sheet is depicted THEN the actions row keeps its four places", (_, step) => {
      // The learner arrived at the expanded sheet by tapping the last of these.
      // A control that vanishes on being pressed makes the two frames read as
      // unrelated screens rather than as one sheet growing.
      const { container } = render(<GuidePhoneScreen step={step!} />);

      expect(container.querySelector("[data-sheet-actions]")?.children).toHaveLength(4);
    });

    test("WHEN the expanded sheet is depicted THEN it does not still say View More", () => {
      // iOS relabels that control «Ver menos» once the sheet is open, so the
      // name belongs only on the frame where the learner has to find it.
      render(<GuidePhoneScreen step={ADD_TO_HOME_STEP!} />);

      expect(screen.queryByText(MESSAGES.iosViewMore!)).not.toBeInTheDocument();
    });
  });

  describe("GIVEN the depiction is a picture, not instructions", () => {
    test("WHEN rendered THEN it is hidden from assistive technology", () => {
      const { container } = render(<GuidePhoneScreen step={MORE_STEP!} />);

      expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN rendered THEN it exposes no controls of its own", () => {
      render(<GuidePhoneScreen step={ADD_STEP!} />);

      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });
});

describe("GuidePhoneScreen motion", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN a learner who needs to see where the tap lands", () => {
    test.each([
      ["the More control", MORE_STEP],
      ["Share", SHARE_STEP],
      ["View More", VIEW_MORE_STEP],
      ["Add to Home Screen", ADD_TO_HOME_STEP],
      ["Add", ADD_STEP],
    ])("WHEN the step targets %s THEN it carries a pointer and a tap indication", (_, step) => {
      const { container } = render(<GuidePhoneScreen step={step!} />);

      expect(container.querySelector(".guide-point")).toBeInTheDocument();
      expect(container.querySelector(".guide-tap")).toBeInTheDocument();
    });
  });

  describe("GIVEN iOS surfaces arrive rather than appear", () => {
    test.each([
      ["the collapsed share sheet", VIEW_MORE_STEP],
      ["the expanded share sheet", ADD_TO_HOME_STEP],
      ["the confirmation screen", ADD_STEP],
    ])("WHEN %s is depicted THEN it rises from the bottom edge", (_, step) => {
      const { container } = render(<GuidePhoneScreen step={step!} />);

      expect(container.querySelector(".guide-sheet-rise")).toBeInTheDocument();
    });

    test("WHEN the menu is depicted THEN it opens out of its corner", () => {
      const { container } = render(<GuidePhoneScreen step={SHARE_STEP!} />);

      expect(container.querySelector(".guide-menu-pop")).toBeInTheDocument();
    });
  });
});

describe("GuidePhoneScreen result frame", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN the flow is done", () => {
    test("WHEN the result is depicted THEN the course icon sits among other apps", () => {
      const { container } = render(<GuidePhoneScreen step={INSTALL_RESULT} />);

      expect(screen.getByText(BRAND)).toBeInTheDocument();
      expect(container.querySelectorAll("[data-home-app]").length).toBeGreaterThan(1);
    });

    test("WHEN the result is depicted THEN nothing is pointed at", () => {
      // There is no control to tap here; a pointer would invent one.
      const { container } = render(<GuidePhoneScreen step={INSTALL_RESULT} />);

      expect(container.querySelector(".guide-point")).not.toBeInTheDocument();
      expect(container.querySelector(".guide-tap")).not.toBeInTheDocument();
    });
  });
});
