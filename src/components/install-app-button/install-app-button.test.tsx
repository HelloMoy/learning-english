import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AddToHomeScreenModal } from "../modals/add-to-home-screen-modal/add-to-home-screen-modal";
import { InstallPromptModal } from "../modals/install-prompt-modal/install-prompt-modal";
import { SafariInstallGuideModal } from "../modals/safari-install-guide-modal/safari-install-guide-modal";
import { InstallAppButton } from "./install-app-button";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  openGuide: "Cómo añadir este curso a tu pantalla de inicio",
  openPrompt: "Instalar este curso en tu dispositivo",
  openGuideIpad: "Cómo añadir este curso a tu pantalla de inicio",
  openGuideMac: "Cómo añadir este curso a tu Dock",
};

const GUIDE = { kind: "guide" } as const;

describe("InstallAppButton", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN a browser that can only be taught the flow", () => {
    test("WHEN rendered THEN the control says it will show instructions", () => {
      render(<InstallAppButton path={GUIDE} />);

      expect(screen.getByRole("button", { name: MESSAGES.openGuide })).toBeInTheDocument();
    });

    test("WHEN activated THEN it opens the guide's modal", async () => {
      const user = userEvent.setup();
      const show = vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
      render(<InstallAppButton path={GUIDE} />);

      await user.click(screen.getByRole("button", { name: MESSAGES.openGuide }));

      expect(show).toHaveBeenCalledWith(AddToHomeScreenModal);
    });

    test("WHEN rendered THEN its glyph is decorative", () => {
      // The name carries the meaning; the glyph is there so the learner starts
      // recognising the icon iOS uses for this.
      const { container } = render(<InstallAppButton path={GUIDE} />);

      const glyph = container.querySelector("svg");

      expect(glyph).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("GIVEN a Safari whose taps are not the iPhone's", () => {
    test("WHEN it is an iPad THEN it opens that platform's guide", async () => {
      // The iPad guide names controls an iPhone does not have, and the other
      // way round. Opening the wrong one sends the learner hunting.
      const user = userEvent.setup();
      const show = vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
      render(<InstallAppButton path={{ kind: "ipad-guide" }} />);

      await user.click(screen.getByRole("button", { name: MESSAGES.openGuideIpad }));

      expect(show).toHaveBeenCalledWith(SafariInstallGuideModal, { platform: "ipad" });
    });

    test("WHEN it is a Mac THEN the control speaks of the Dock", async () => {
      // A Mac has no home screen, so promising one names a place the learner
      // cannot go and look at.
      const user = userEvent.setup();
      const show = vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
      render(<InstallAppButton path={{ kind: "mac-guide" }} />);

      await user.click(screen.getByRole("button", { name: MESSAGES.openGuideMac }));

      expect(show).toHaveBeenCalledWith(SafariInstallGuideModal, { platform: "mac" });
    });
  });

  describe("GIVEN a browser that offers to do the install itself", () => {
    test("WHEN rendered THEN the control says it will install, not instruct", () => {
      // Being told "here is how to do it" and then handed a one-tap dialog is a
      // promise the control did not keep.
      render(<InstallAppButton path={{ kind: "prompt", accept: vi.fn() }} />);

      expect(screen.getByRole("button", { name: MESSAGES.openPrompt })).toBeInTheDocument();
    });

    test("WHEN activated THEN it opens the prompt, carrying the browser's offer", async () => {
      const user = userEvent.setup();
      const accept = vi.fn();
      const show = vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
      render(<InstallAppButton path={{ kind: "prompt", accept }} />);

      await user.click(screen.getByRole("button", { name: MESSAGES.openPrompt }));

      expect(show).toHaveBeenCalledWith(InstallPromptModal, { onAccept: accept });
    });

    test("WHEN rendered THEN it carries the same glyph as the guide's control", () => {
      // The control means the same thing on every platform; only what it opens
      // differs.
      const { container } = render(<InstallAppButton path={{ kind: "prompt", accept: vi.fn() }} />);

      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
