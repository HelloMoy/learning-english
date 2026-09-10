import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AddToHomeScreenModal } from "../modals/add-to-home-screen-modal/add-to-home-screen-modal";
import { InstallAppButton } from "./install-app-button";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  openGuide: "Cómo añadir este curso a tu pantalla de inicio",
};

describe("InstallAppButton", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN the header has decided to show it", () => {
    test("WHEN rendered THEN the control carries its localized name", () => {
      render(<InstallAppButton />);

      expect(screen.getByRole("button", { name: MESSAGES.openGuide })).toBeInTheDocument();
    });

    test("WHEN rendered THEN its glyph is decorative", () => {
      // The name carries the meaning; the glyph is there so the learner starts
      // recognising the icon iOS uses for this.
      const { container } = render(<InstallAppButton />);

      const glyph = container.querySelector("svg");

      expect(glyph).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN activated THEN it opens the guide's modal", async () => {
      const user = userEvent.setup();
      const show = vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
      render(<InstallAppButton />);

      await user.click(screen.getByRole("button", { name: MESSAGES.openGuide }));

      expect(show).toHaveBeenCalledWith(AddToHomeScreenModal);
    });
  });
});
