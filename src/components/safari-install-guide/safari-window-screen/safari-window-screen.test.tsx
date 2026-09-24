import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  SAFARI_INSTALL_RESULT,
  SAFARI_INSTALL_STEPS,
} from "../safari-install-steps/safari-install-steps";
import { SafariWindowScreen } from "./safari-window-screen";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  iosShare: "Compartir",
  iosViewMore: "Ver más",
  iosAddToHomeScreen: "Añadir a pantalla de inicio",
  iosAdd: "Añadir",
  iosOpenAsWebApp: "Abrir como app web",
  macAddToDock: "Añadir al Dock",
};

const ipadStep = (index: number) => SAFARI_INSTALL_STEPS.ipad[index]!;
const macStep = (index: number) => SAFARI_INSTALL_STEPS.mac[index]!;

const renderStep = (
  platform: "ipad" | "mac",
  step: Parameters<typeof SafariWindowScreen>[0]["step"],
) =>
  render(
    <SafariWindowScreen
      platform={platform}
      step={step}
    />,
  );

describe("SafariWindowScreen", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN the depiction repeats what the instruction already says", () => {
    test("WHEN rendered THEN it is hidden from assistive technology", () => {
      const { container } = renderStep("ipad", ipadStep(0));

      expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("GIVEN the target must be findable on the learner's own screen", () => {
    test("WHEN a step is drawn THEN its target carries that locale's label", () => {
      const { getByText } = renderStep("ipad", ipadStep(1));

      expect(getByText(MESSAGES.iosViewMore!)).toBeInTheDocument();
    });

    test("WHEN the macOS target is drawn THEN it is named in that locale too", () => {
      const { getByText } = renderStep("mac", macStep(1));

      expect(getByText(MESSAGES.macAddToDock!)).toBeInTheDocument();
    });
  });

  describe("GIVEN Safari does not dim the page behind its share popover", () => {
    test("WHEN the popover is drawn THEN nothing dims the page", () => {
      const { container } = renderStep("ipad", ipadStep(1));

      expect(container.querySelector('[data-slot="scrim"]')).not.toBeInTheDocument();
    });

    test("WHEN the confirmation is drawn THEN the page is dimmed", () => {
      const { container } = renderStep("ipad", ipadStep(3));

      expect(container.querySelector('[data-slot="scrim"]')).toBeInTheDocument();
    });
  });

  describe("GIVEN the iPad's popover opens collapsed", () => {
    test("WHEN the expanding step is drawn THEN there is no list to scroll", () => {
      // Sending the learner to a list their iPad is not showing is the trap
      // this whole step exists to avoid.
      const { container } = renderStep("ipad", ipadStep(1));

      expect(container.querySelector('[data-slot="popover-list"]')).not.toBeInTheDocument();
    });

    test("WHEN the expanded step is drawn THEN the list is there, complete", () => {
      const { container, getByText } = renderStep("ipad", ipadStep(2));

      expect(container.querySelector('[data-slot="popover-list"]')).toBeInTheDocument();
      expect(getByText(MESSAGES.iosAddToHomeScreen!)).toBeInTheDocument();
    });

    test("WHEN the expanded step is drawn THEN the target has rows below it", () => {
      // On a real iPad, Markup and Print sit under it. Drawing it last would
      // teach a position at the bottom of the list that it does not occupy.
      const { container } = renderStep("ipad", ipadStep(2));

      const rows = [...container.querySelectorAll('[data-slot="popover-row"]')];
      const targetIndex = rows.findIndex((row) => row.textContent === MESSAGES.iosAddToHomeScreen);

      expect(targetIndex).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(targetIndex + 1);
    });

    test("WHEN the expanded step is drawn THEN the round actions are still there", () => {
      // Moving between the two has to read as one popover growing, not as two
      // unrelated panels.
      const { container } = renderStep("ipad", ipadStep(2));

      expect(container.querySelector('[data-slot="round-actions"]')).toBeInTheDocument();
    });

    test("WHEN the expanding step is drawn THEN its control carries the chevron", () => {
      // iPadOS draws a downward chevron on that control. A blank circle makes
      // the learner match on position alone.
      const { container } = renderStep("ipad", ipadStep(1));

      expect(container.querySelector('[data-glyph="chevron-down"]')).toBeInTheDocument();
    });

    test("WHEN the popover is expanded THEN the chevron has turned over", () => {
      // It points up once open, because tapping it now closes the popover.
      const { container } = renderStep("ipad", ipadStep(2));

      expect(container.querySelector('[data-glyph="chevron-up"]')).toBeInTheDocument();
      expect(container.querySelector('[data-glyph="chevron-down"]')).not.toBeInTheDocument();
    });

    test("WHEN Add to Home Screen is drawn THEN it carries its own glyph", () => {
      // The square-with-a-plus is the mark the learner is being taught to find,
      // and the same one the header chip wears.
      const { container } = renderStep("ipad", ipadStep(2));

      expect(container.querySelector('[data-glyph="square-plus"]')).toBeInTheDocument();
    });

    test("WHEN the expanded step is drawn THEN nothing still says View More", () => {
      // iPadOS relabels it to View Less once open.
      const { queryByText } = renderStep("ipad", ipadStep(2));

      expect(queryByText(MESSAGES.iosViewMore!)).not.toBeInTheDocument();
    });
  });

  describe("GIVEN the Mac's popover opens complete", () => {
    test("WHEN it is drawn THEN it has no round actions and no expanding control", () => {
      const { container, queryByText } = renderStep("mac", macStep(1));

      expect(container.querySelector('[data-slot="round-actions"]')).not.toBeInTheDocument();
      expect(queryByText(MESSAGES.iosViewMore!)).not.toBeInTheDocument();
    });

    test("WHEN Add to Dock is drawn THEN it carries its own glyph", () => {
      // Safari marks it with a display, not the square-and-plus iOS uses: the
      // Mac is gaining a Dock icon, not a home screen tile.
      const { container } = renderStep("mac", macStep(1));

      expect(container.querySelector('[data-glyph="add-to-dock"]')).toBeInTheDocument();
      expect(container.querySelector('[data-glyph="square-plus"]')).not.toBeInTheDocument();
    });

    test("WHEN it is drawn THEN the target sits among the other rows, not first", () => {
      // "Add to Dock" is fifth on a real Mac. Putting it first would teach a
      // position the learner will not find.
      const { container } = renderStep("mac", macStep(1));

      const rows = [...(container.querySelectorAll('[data-slot="popover-row"]') ?? [])];
      const targetIndex = rows.findIndex((row) => row.textContent === MESSAGES.macAddToDock);

      expect(targetIndex).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(targetIndex + 1);
    });
  });

  describe("GIVEN the two confirmations are different windows", () => {
    test("WHEN the iPad confirms THEN it offers the web app switch", () => {
      const { container, getByText } = renderStep("ipad", ipadStep(3));

      expect(container.querySelector('[data-slot="web-app-switch"]')).toBeInTheDocument();
      expect(getByText(MESSAGES.iosOpenAsWebApp!)).toBeInTheDocument();
    });

    test("WHEN the Mac confirms THEN there is no web app switch", () => {
      // Safari on macOS offers none, so drawing one invents a control.
      const { container } = renderStep("mac", macStep(2));

      expect(container.querySelector('[data-slot="web-app-switch"]')).not.toBeInTheDocument();
    });

    test("WHEN either confirms THEN the Add control is named in that locale", () => {
      const { getByText } = renderStep("mac", macStep(2));

      expect(getByText(MESSAGES.iosAdd!)).toBeInTheDocument();
    });
  });

  describe("GIVEN the taps buy an icon somewhere", () => {
    test("WHEN the iPad result is drawn THEN it is a home screen", () => {
      const { container } = renderStep("ipad", SAFARI_INSTALL_RESULT.ipad);

      expect(container.querySelector('[data-slot="home-screen"]')).toBeInTheDocument();
    });

    test("WHEN the Mac result is drawn THEN it is the Dock", () => {
      const { container } = renderStep("mac", SAFARI_INSTALL_RESULT.mac);

      expect(container.querySelector('[data-slot="dock"]')).toBeInTheDocument();
    });
  });
});
