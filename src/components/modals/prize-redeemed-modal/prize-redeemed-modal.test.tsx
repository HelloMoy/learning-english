import { renderInLocale } from "@/test-setup/render-in-locale";

import NiceModal from "@ebay/nice-modal-react";
import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { PrizeRedeemedModal } from "./prize-redeemed-modal";

/** NiceModal only renders what it has been told to show. */
const RegisteredModal = () => {
  NiceModal.useModal(PrizeRedeemedModal);
  return null;
};

/** Where the counter says the learner left off. */
const CONTINUE_HREF = "/courses/basic-course/modules/2-vowels/lessons/schwa";

const vowelsHarmonica = {
  prize: "harmonica",
  moduleTitle: "Vowels",
  ticketCount: 17,
  continueHref: CONTINUE_HREF,
} as const;

const renderRedeemed = (
  onClosed: () => void = vi.fn(),
  locale?: "en" | "es" | "pt",
  overrides: { continueHref?: string | null } = {},
) =>
  renderInLocale(
    <NiceModal.Provider>
      <RegisteredModal />
      <button
        type="button"
        onClick={() =>
          void NiceModal.show(PrizeRedeemedModal, { ...vowelsHarmonica, ...overrides }).then(
            onClosed,
          )
        }
      >
        open
      </button>
    </NiceModal.Provider>,
    locale,
  );

const openDialog = async (
  locale?: "en" | "es" | "pt",
  onClosed?: () => void,
  overrides?: { continueHref?: string | null },
) => {
  const user = userEvent.setup();
  renderRedeemed(onClosed, locale, overrides);
  await user.click(screen.getByRole("button", { name: "open" }));
  return { user, dialog: await screen.findByRole("dialog") };
};

describe("PrizeRedeemedModal", () => {
  test("WHEN shown THEN the dialog is named after the prize AND says which module's tickets redeemed it", async () => {
    const { dialog } = await openDialog();

    expect(screen.getByRole("dialog", { name: "Harmonica" })).toBe(dialog);
    expect(dialog).toHaveTextContent("Prize redeemed");
    expect(dialog).toHaveTextContent("You collected all 17 tickets of Vowels.");
  });

  test("WHEN shown THEN the coloured prize is drawn over its silhouette", async () => {
    const { dialog } = await openDialog();

    expect(dialog.querySelector('svg[data-prize="harmonica"][data-locked="false"]')).not.toBeNull();
    expect(dialog.querySelector('svg[data-prize="harmonica"][data-locked="true"]')).not.toBeNull();
  });

  test("WHEN shown THEN a ticket flies in for each ticket redeemed", async () => {
    const { dialog } = await openDialog();

    expect(dialog.querySelectorAll(".redeem-feed")).toHaveLength(17);
  });

  test("WHEN shown on the counter THEN it offers two named ways out, one of them onward", async () => {
    // This replaces a guard that asserted the dialog offered no way onward at
    // all. That was a deliberate decision — the payout led nowhere — and this
    // change reverses it: the reveal now hands the learner back to the course.
    const { dialog } = await openDialog();

    expect(within(dialog).getByRole("button", { name: "Great" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Continue the course" })).toHaveAttribute(
      "href",
      CONTINUE_HREF,
    );
  });

  test("WHEN there is nowhere to continue THEN only the closing control is offered", async () => {
    // An empty catalog, or a learner whose record resolves to nothing at all.
    const { dialog } = await openDialog(undefined, undefined, { continueHref: null });

    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Great" })).toBeInTheDocument();
  });

  test("WHEN the closing control is chosen THEN the dialog closes AND focus returns to where it was", async () => {
    const onClosed = vi.fn();
    const { user } = await openDialog(undefined, onClosed);

    await user.click(screen.getByRole("button", { name: "Great" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "open" })).toHaveFocus();
  });

  test("WHEN Escape is pressed THEN the dialog closes", async () => {
    const { user } = await openDialog();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test("WHEN shown in es THEN the prize and the copy are Spanish", async () => {
    const { dialog } = await openDialog("es");

    expect(screen.getByRole("dialog", { name: "Armónica" })).toBe(dialog);
    expect(dialog).toHaveTextContent("Juntaste los 17 tickets de Vowels.");
    expect(within(dialog).getByRole("button", { name: "¡Genial!" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Seguir con el curso" })).toBeInTheDocument();
  });
});
