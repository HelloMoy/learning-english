import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";

import NiceModal from "@ebay/nice-modal-react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { DeleteAccountModal } from "./delete-account-modal";

const copy = MESSAGES.pt.Profile.deleteAccount;

/** NiceModal only renders what it has been told to show. */
const ShownModal = () => {
  NiceModal.useModal(DeleteAccountModal);
  return null;
};

const openWithDecision = async (onDecision: (confirmed: unknown) => void) => {
  renderInLocale(
    <NiceModal.Provider>
      <ShownModal />
      <button onClick={() => void NiceModal.show(DeleteAccountModal).then(onDecision)}>open</button>
    </NiceModal.Provider>,
    "pt",
  );
  await userEvent.click(screen.getByText("open"));
  return screen.findByRole("dialog", { name: copy.dialogTitle });
};

describe("DeleteAccountModal", () => {
  test("WHEN shown THEN it names what goes, that it is final, and that an email comes first", async () => {
    const dialog = await openWithDecision(vi.fn());

    expect(dialog).toHaveTextContent(copy.dialogConsequence);
    expect(dialog).toHaveTextContent(copy.dialogIrreversible);
    expect(dialog).toHaveTextContent(copy.dialogEmail);
  });

  test("WHEN shown THEN Cancel holds the focus AND Enter closes without confirming", async () => {
    const onDecision = vi.fn();
    await openWithDecision(onDecision);

    expect(screen.getByRole("button", { name: copy.cancel })).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(onDecision).toHaveBeenCalledWith(false);
  });

  test("WHEN the learner confirms THEN it resolves true", async () => {
    const onDecision = vi.fn();
    await openWithDecision(onDecision);

    await userEvent.click(screen.getByRole("button", { name: copy.confirm }));

    expect(onDecision).toHaveBeenCalledWith(true);
  });

  test("WHEN the learner presses Escape THEN it resolves false", async () => {
    const onDecision = vi.fn();
    await openWithDecision(onDecision);

    await userEvent.keyboard("{Escape}");

    expect(onDecision).toHaveBeenCalledWith(false);
  });
});
