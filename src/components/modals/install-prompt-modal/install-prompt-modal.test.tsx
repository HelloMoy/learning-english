import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { InstallPromptModal } from "./install-prompt-modal";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  dialogTitle: "Instalar el curso",
  dismiss: "Ahora no",
  "handheld.title": "Ten el curso en tu pantalla de inicio",
  "handheld.body":
    "Se abre a pantalla completa, sin la barra del navegador alrededor, y queda junto a tus otras apps.",
  "handheld.confirm": "Añadir a inicio",
  "desktop.title": "Instala el curso como app",
  "desktop.body":
    "Se abre en su propia ventana, sin pestañas ni barra de direcciones, y lo abres como cualquier otra app.",
  "desktop.confirm": "Instalar",
};

/** jsdom's own answer to every media query is no, which is a desktop here. */
const stubCoarsePointer = () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      media: "(pointer: coarse)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

/** NiceModal only renders what it has been told to show. */
const renderShown = (onAccept: () => void) => {
  const Shown = () => {
    NiceModal.useModal(InstallPromptModal);
    return null;
  };

  return render(
    <NiceModal.Provider>
      <Shown />
      <button onClick={() => void NiceModal.show(InstallPromptModal, { onAccept })}>abrir</button>
    </NiceModal.Provider>,
  );
};

const open = async (onAccept = vi.fn()) => {
  const user = userEvent.setup();
  const { getByText } = renderShown(onAccept);

  await user.click(getByText("abrir"));
  await screen.findByRole("dialog");

  return { user, onAccept };
};

describe("InstallPromptModal", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("GIVEN a learner on a desktop", () => {
    test("WHEN shown THEN the dialog is named for the task", async () => {
      await open();

      expect(screen.getByRole("dialog", { name: MESSAGES.dialogTitle })).toBeInTheDocument();
    });

    test("WHEN shown THEN it offers to install, in the desktop's own words", async () => {
      // A desktop has a dock, not a home screen: offering to add to one names a
      // place the learner cannot go and look at.
      await open();

      expect(screen.getByRole("button", { name: MESSAGES["desktop.confirm"] })).toBeInTheDocument();
      expect(screen.getByText(MESSAGES["desktop.body"]!)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: MESSAGES["handheld.confirm"] }),
      ).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a learner on a handheld", () => {
    test("WHEN shown THEN it offers the home screen, in that platform's own words", async () => {
      stubCoarsePointer();

      await open();

      expect(
        screen.getByRole("button", { name: MESSAGES["handheld.confirm"] }),
      ).toBeInTheDocument();
      expect(screen.getByText(MESSAGES["handheld.body"]!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a prompt that used to show only its own icon", () => {
    test("WHEN shown on a desktop THEN it draws the application switcher", async () => {
      const { container } = renderShown(vi.fn());
      const user = userEvent.setup();
      await user.click(container.ownerDocument.body.querySelector("button")!);
      await screen.findByRole("dialog");

      expect(document.querySelector('[data-slot="app-switcher"]')).toBeInTheDocument();
    });

    test("WHEN shown on a handheld THEN it draws the home screen", async () => {
      stubCoarsePointer();
      await open();

      expect(document.querySelector('[data-slot="home-screen"]')).toBeInTheDocument();
    });

    test("WHEN shown THEN the icon is not also shown beside the picture", async () => {
      // Two copies of the icon in a 300px dialog is one too many; the picture
      // already carries the identity.
      await open();

      expect(document.querySelectorAll('[data-slot="app-icon"]')).toHaveLength(1);
    });
  });

  describe("GIVEN a learner deciding", () => {
    test("WHEN they accept THEN the browser's own install is asked for", async () => {
      const { user, onAccept } = await open();

      await user.click(screen.getByRole("button", { name: MESSAGES["desktop.confirm"] }));

      expect(onAccept).toHaveBeenCalledOnce();
    });

    test("WHEN they accept THEN the modal gets out of the way", async () => {
      // What comes next is the browser's own dialog; two stacked dialogs would
      // leave the learner confirming into ours.
      const { user } = await open();

      await user.click(screen.getByRole("button", { name: MESSAGES["desktop.confirm"] }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("WHEN they decline THEN nothing is asked of the browser", async () => {
      const { user, onAccept } = await open();

      await user.click(screen.getByRole("button", { name: MESSAGES.dismiss }));

      expect(onAccept).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("WHEN shown THEN it never claims the app was installed", async () => {
      // The outcome belongs to a dialog this app does not draw.
      const { user, onAccept } = await open();

      await user.click(screen.getByRole("button", { name: MESSAGES["desktop.confirm"] }));

      expect(onAccept).toHaveBeenCalledOnce();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
