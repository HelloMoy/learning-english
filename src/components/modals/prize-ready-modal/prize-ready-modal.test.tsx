import { renderInLocale } from "@/test-setup/render-in-locale";

import NiceModal from "@ebay/nice-modal-react";
import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { PrizeReadyModal } from "./prize-ready-modal";

/** NiceModal only renders what it has been told to show. */
const RegisteredModal = () => {
  NiceModal.useModal(PrizeReadyModal);
  return null;
};

const vowelsWaiting = {
  prize: "harmonica",
  moduleTitle: "Vowels",
  moduleSlug: "2-vowels",
  ticketCount: 17,
} as const;

const renderReady = (onClosed: () => void = vi.fn(), locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <NiceModal.Provider>
      <RegisteredModal />
      <button
        type="button"
        onClick={() => void NiceModal.show(PrizeReadyModal, vowelsWaiting).then(onClosed)}
      >
        open
      </button>
    </NiceModal.Provider>,
    locale,
  );

const openDialog = async (locale?: "en" | "es" | "pt", onClosed?: () => void) => {
  const user = userEvent.setup();
  renderReady(onClosed, locale);
  await user.click(screen.getByRole("button", { name: "open" }));
  return { user, dialog: await screen.findByRole("dialog") };
};

describe("PrizeReadyModal", () => {
  test("WHEN shown THEN it says a prize is waiting AND names the module and its tickets", async () => {
    const { dialog } = await openDialog();

    expect(screen.getByRole("dialog", { name: "A prize is waiting for you" })).toBe(dialog);
    expect(dialog).toHaveTextContent("You collected all 17 tickets of Vowels.");
  });

  test("WHEN shown THEN the prize stays a silhouette, so the counter keeps the surprise", async () => {
    const { dialog } = await openDialog();

    expect(dialog.querySelector('svg[data-prize="harmonica"][data-locked="true"]')).not.toBeNull();
    expect(dialog.querySelector('svg[data-locked="false"]')).toBeNull();
    expect(dialog).not.toHaveTextContent("Harmonica");
  });

  test("WHEN shown THEN Go and claim the prize asks the counter for this module's prize", async () => {
    // The counter needs to know which prize the learner came for, so it can
    // bring that one into view among the shelves.
    const { dialog } = await openDialog();

    expect(within(dialog).getByRole("link", { name: "Go and claim the prize" })).toHaveAttribute(
      "href",
      "/achievements?claim=2-vowels",
    );
  });

  test("WHEN Keep learning is chosen THEN the dialog closes AND focus returns to where it was", async () => {
    const onClosed = vi.fn();
    const { user } = await openDialog(undefined, onClosed);

    await user.click(screen.getByRole("button", { name: "Keep learning" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "open" })).toHaveFocus();
  });

  test("WHEN Escape is pressed THEN the dialog closes", async () => {
    const { user } = await openDialog();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test("WHEN shown in es THEN the copy and the actions are Spanish", async () => {
    const { dialog } = await openDialog("es");

    expect(screen.getByRole("dialog", { name: "Tienes un premio esperando" })).toBe(dialog);
    expect(dialog).toHaveTextContent("Juntaste los 17 tickets de Vowels.");
    expect(within(dialog).getByRole("link", { name: "Ir a reclamar premio" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Seguir aprendiendo" })).toBeInTheDocument();
  });
});
