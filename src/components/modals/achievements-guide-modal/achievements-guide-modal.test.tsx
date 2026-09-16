import { renderInLocale } from "@/test-setup/render-in-locale";

import NiceModal from "@ebay/nice-modal-react";
import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { AchievementsGuideModal } from "./achievements-guide-modal";

/** NiceModal only renders what it has been told to show. */
const RegisteredModal = () => {
  NiceModal.useModal(AchievementsGuideModal);
  return null;
};

const renderGuide = (onClosed: () => void = vi.fn(), locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <NiceModal.Provider>
      <RegisteredModal />
      <button
        type="button"
        onClick={() => void NiceModal.show(AchievementsGuideModal).then(onClosed)}
      >
        open
      </button>
    </NiceModal.Provider>,
    locale,
  );

describe("AchievementsGuideModal", () => {
  test("WHEN shown THEN it is a dialog named after how tickets and prizes work", async () => {
    const user = userEvent.setup();
    renderGuide();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(
      await screen.findByRole("dialog", { name: "How do tickets and prizes work?" }),
    ).toBeInTheDocument();
  });

  test("WHEN shown THEN it explains tickets, prizes, distinctions and un-marking", async () => {
    const user = userEvent.setup();
    renderGuide();

    await user.click(screen.getByRole("button", { name: "open" }));
    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveTextContent("Complete a lesson to earn its ticket");
    expect(dialog).toHaveTextContent("Collect every ticket of a module to claim its prize");
    expect(dialog).toHaveTextContent("Complete a course to turn your card bronze");
  });

  test("WHEN shown THEN the ticket and prize examples are drawn beside their explanations", async () => {
    const user = userEvent.setup();
    renderGuide();

    await user.click(screen.getByRole("button", { name: "open" }));
    const dialog = await screen.findByRole("dialog");

    expect(dialog.querySelector("[data-ticket-size]")).not.toBeNull();
    // One prize, and one the learner can recognise: a silhouette is what a
    // prize looks like when it is not theirs, which is not what this explains.
    expect(dialog.querySelectorAll("svg[data-prize]")).toHaveLength(1);
    expect(dialog.querySelector('svg[data-locked="true"]')).toBeNull();
  });

  test("WHEN shown THEN its three levels rise one after another", async () => {
    const user = userEvent.setup();
    renderGuide();

    await user.click(screen.getByRole("button", { name: "open" }));
    const dialog = await screen.findByRole("dialog");

    const rising = Array.from(dialog.querySelectorAll<HTMLElement>(".achievement-rise"));
    expect(rising.map((element) => element.style.getPropertyValue("--motion-order"))).toEqual([
      "0",
      "1",
      "2",
    ]);
    expect(rising.at(-1)).toHaveTextContent("Distinction");
  });

  test("WHEN Escape is pressed THEN the dialog closes and the promise settles once", async () => {
    const user = userEvent.setup();
    const onClosed = vi.fn();
    renderGuide(onClosed);

    await user.click(screen.getByRole("button", { name: "open" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  test("WHEN the dialog closes THEN focus returns to the control that opened it", async () => {
    // Shown through NiceModal there is no DialogTrigger for Radix to refocus,
    // so without this the learner's focus is dropped onto the page.
    const user = userEvent.setup();
    renderGuide();

    const opener = screen.getByRole("button", { name: "open" });
    await user.click(opener);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  test("WHEN Got it is chosen THEN the dialog closes", async () => {
    const user = userEvent.setup();
    const onClosed = vi.fn();
    renderGuide(onClosed);

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(await screen.findByRole("button", { name: "Got it" }));

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
  });

  test("WHEN shown in es THEN its title is Spanish", async () => {
    const user = userEvent.setup();
    renderGuide(vi.fn(), "es");

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(
      await screen.findByRole("dialog", { name: "¿Cómo funcionan los tickets y los premios?" }),
    ).toBeInTheDocument();
  });
});
