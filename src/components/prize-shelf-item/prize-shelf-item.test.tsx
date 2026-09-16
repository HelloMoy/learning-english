import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { PrizeShelfItem } from "./prize-shelf-item";

describe("PrizeShelfItem", () => {
  test("WHEN the prize is claimed THEN it is named, glows and is tagged Redeemed", () => {
    const { container } = renderInLocale(
      <PrizeShelfItem
        prize="whistle"
        moduleTitle="Introduction"
        moduleSlug="1-introduction"
        state="claimed"
        ticketsEarned={1}
        ticketCount={1}
      />,
    );

    const item = container.querySelector("[data-prize-state]");
    expect(item).toHaveAttribute("data-prize-state", "claimed");
    expect(
      screen.getByText("Whistle: prize redeemed", { selector: ".sr-only" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Whistle", { selector: "[aria-hidden='true'] *, [aria-hidden='true']" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Redeemed", { selector: "[aria-hidden='true'] *, [aria-hidden='true']" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".prize-glow")).not.toBeNull();
    expect(container.querySelector("svg")).not.toHaveAttribute("data-locked", "true");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("WHEN every ticket is collected but the prize is unclaimed THEN it stays hidden behind a Claim prize control", () => {
    const { container } = renderInLocale(
      <PrizeShelfItem
        prize="whistle"
        moduleTitle="Introduction"
        moduleSlug="1-introduction"
        state="ready"
        ticketsEarned={1}
        ticketCount={1}
        onClaim={vi.fn()}
      />,
    );

    expect(container.querySelector("[data-prize-state]")).toHaveAttribute(
      "data-prize-state",
      "ready",
    );
    expect(container.querySelector("svg")).toHaveAttribute("data-locked", "true");
    expect(screen.queryByText("Whistle")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Claim the Introduction prize" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hidden prize of Introduction: ready to claim", { selector: ".sr-only" }),
    ).toBeInTheDocument();
  });

  test("WHEN the Claim prize control is activated THEN its module is claimed", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    renderInLocale(
      <PrizeShelfItem
        prize="harmonica"
        moduleTitle="Vowels"
        moduleSlug="2-vowels"
        state="ready"
        ticketsEarned={17}
        ticketCount={17}
        onClaim={onClaim}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Claim the Vowels prize" }));

    expect(onClaim).toHaveBeenCalledExactlyOnceWith("2-vowels");
  });

  test("WHEN tickets are still being collected THEN the prize stays a silhouette, unnamed, with a swaying tag", () => {
    const { container } = renderInLocale(
      <PrizeShelfItem
        prize="harmonica"
        moduleTitle="Vowels"
        moduleSlug="2-vowels"
        state="collecting"
        ticketsEarned={12}
        ticketCount={17}
      />,
    );

    expect(
      screen.getByText("Hidden prize of Vowels: 12 of 17 tickets", { selector: ".sr-only" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Harmonica")).not.toBeInTheDocument();
    expect(screen.getByText("12 / 17")).toHaveClass("prize-sway");
    expect(container.querySelector("svg")).toHaveAttribute("data-locked", "true");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("WHEN no ticket is collected THEN the tag reads zero and does not sway", () => {
    renderInLocale(
      <PrizeShelfItem
        prize="megaphone"
        moduleTitle="Consonants"
        moduleSlug="3-consonants"
        state="locked"
        ticketsEarned={0}
        ticketCount={25}
      />,
    );

    expect(screen.getByText("0 / 25")).not.toHaveClass("prize-sway");
    expect(
      screen.getByText("Hidden prize of Consonants: 0 of 25 tickets", { selector: ".sr-only" }),
    ).toBeInTheDocument();
  });

  test("WHEN the prize is the one the learner came for THEN the toy waves and its control stays put", () => {
    const { container } = renderInLocale(
      <PrizeShelfItem
        prize="whistle"
        moduleTitle="Introduction"
        moduleSlug="1-introduction"
        state="ready"
        ticketsEarned={1}
        ticketCount={1}
        isCalled
        onClaim={vi.fn()}
      />,
    );

    const item = container.querySelector("[data-prize-state]");
    expect(item).toHaveAttribute("data-called", "true");

    // The toy is what moves. A control that shifts under the pointer is hard to
    // press — so the item and the button it holds must stay where they are.
    const waving = container.querySelector(".prize-called");
    expect(waving?.querySelector("svg[data-prize]")).not.toBeNull();
    expect(item).not.toHaveClass("prize-called");
    const claim = screen.getByRole("button", { name: "Claim the Introduction prize" });
    expect(waving?.contains(claim)).toBe(false);
  });

  test("WHEN the prize is not the one they came for THEN nothing points at it", () => {
    const { container } = renderInLocale(
      <PrizeShelfItem
        prize="whistle"
        moduleTitle="Introduction"
        moduleSlug="1-introduction"
        state="ready"
        ticketsEarned={1}
        ticketCount={1}
        onClaim={vi.fn()}
      />,
    );

    const item = container.querySelector("[data-prize-state]");
    expect(item).not.toHaveAttribute("data-called", "true");
    expect(container.querySelector(".prize-called")).toBeNull();
  });

  test("WHEN a place in a sequence is given THEN the item rises in that place", () => {
    const { container } = renderInLocale(
      <PrizeShelfItem
        prize="drum"
        moduleTitle="Rhythm"
        moduleSlug="4-rhythm"
        state="locked"
        ticketsEarned={0}
        ticketCount={4}
        motionOrder={3}
      />,
    );

    const item = container.querySelector<HTMLElement>("[data-prize-state]")!;
    expect(item).toHaveClass("achievement-rise");
    expect(item.style.getPropertyValue("--motion-order")).toBe("3");
  });

  test("WHEN rendered in es THEN the hidden state reads in Spanish", () => {
    renderInLocale(
      <PrizeShelfItem
        prize="harmonica"
        moduleTitle="Vowels"
        moduleSlug="2-vowels"
        state="collecting"
        ticketsEarned={1}
        ticketCount={17}
      />,
      "es",
    );

    expect(
      screen.getByText("Premio oculto de Vowels: 1 de 17 tickets", { selector: ".sr-only" }),
    ).toBeInTheDocument();
  });

  test("WHEN a prize ready to claim is rendered in es THEN its control is Spanish", () => {
    renderInLocale(
      <PrizeShelfItem
        prize="harmonica"
        moduleTitle="Vowels"
        moduleSlug="2-vowels"
        state="ready"
        ticketsEarned={17}
        ticketCount={17}
        onClaim={vi.fn()}
      />,
      "es",
    );

    expect(
      screen.getByRole("button", { name: "Reclamar el premio de Vowels" }),
    ).toBeInTheDocument();
  });
});
