import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SafariInstallGuideModal } from "./safari-install-guide-modal";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  ipadDialogTitle: "Añadir a pantalla de inicio",
  macDialogTitle: "Añadir al Dock",
  ipadLabel: "Ten el curso a un toque",
  macLabel: "Ten el curso a un clic",
  dismiss: "Cerrar la guía",
};

const renderShown = (platform: "ipad" | "mac") => {
  const Shown = () => {
    NiceModal.useModal(SafariInstallGuideModal);
    return null;
  };

  return render(
    <NiceModal.Provider>
      <Shown />
      <button onClick={() => void NiceModal.show(SafariInstallGuideModal, { platform })}>
        abrir
      </button>
    </NiceModal.Provider>,
  );
};

describe("SafariInstallGuideModal", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN an iPad learner who asked how to install the app", () => {
    test("WHEN shown THEN the guide is inside a dialog named for the task", async () => {
      const user = userEvent.setup();
      const { getByText } = renderShown("ipad");

      await user.click(getByText("abrir"));

      expect(
        await screen.findByRole("dialog", { name: MESSAGES.ipadDialogTitle }),
      ).toBeInTheDocument();
    });

    test("WHEN shown THEN it is that platform's guide", async () => {
      const user = userEvent.setup();
      const { getByText } = renderShown("ipad");

      await user.click(getByText("abrir"));

      expect(await screen.findByText(MESSAGES.ipadLabel!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a Mac learner", () => {
    test("WHEN shown THEN the dialog is named for the Dock, not a home screen", async () => {
      const user = userEvent.setup();
      const { getByText } = renderShown("mac");

      await user.click(getByText("abrir"));

      expect(
        await screen.findByRole("dialog", { name: MESSAGES.macDialogTitle }),
      ).toBeInTheDocument();
      expect(screen.getByText(MESSAGES.macLabel!)).toBeInTheDocument();
    });
  });

  describe("GIVEN dismissal is the caller's to interpret", () => {
    test("WHEN the guide's own control is used THEN the dialog closes", async () => {
      const user = userEvent.setup();
      const { getByText } = renderShown("mac");
      await user.click(getByText("abrir"));
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: MESSAGES.dismiss }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
