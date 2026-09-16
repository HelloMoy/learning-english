import type { TicketMoment } from "@/hooks/use-lesson-reward-moment/use-lesson-reward-moment";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { TICKET_TOAST_LIFETIME_MS, TicketToast } from "./ticket-toast";

const vowelSoundI: TicketMoment = {
  id: 1,
  lessonTitle: "The vowel sound /i/",
  symbol: "i",
  ticketsEarned: 12,
  ticketCount: 17,
  prize: "harmonica",
  moduleTitle: "Vowels",
  moduleSlug: "2-vowels",
  readiesPrize: false,
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TicketToast", () => {
  test("WHEN there is no moment THEN the status region is present but empty", () => {
    renderInLocale(
      <TicketToast
        moment={null}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  test("WHEN a ticket is earned THEN the status names the lesson AND the tickets towards the module prize", () => {
    renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={vi.fn()}
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("+1 ticket · The vowel sound /i/");
    expect(status).toHaveTextContent("12 of 17 tickets for the Vowels prize");
  });

  test("WHEN a ticket is earned THEN the notification sits at the top, at every width", () => {
    renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={vi.fn()}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.className).toContain("top-");
    expect(status.className).not.toContain("bottom-");
  });

  test("WHEN a ticket is earned THEN the ticket and the prize silhouette are drawn as decoration", () => {
    renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={vi.fn()}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.querySelector("[data-ticket-size]")).toHaveTextContent("i");
    expect(status.querySelector('svg[data-prize="harmonica"][data-locked="true"]')).not.toBeNull();
  });

  test("WHEN the learner is watching fullscreen THEN the notification is drawn inside what the browser presents", () => {
    // Outside that element the browser paints nothing, so a pill fixed to the
    // document would never reach a learner watching fullscreen.
    const player = document.createElement("div");
    document.body.append(player);
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: player });

    renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={vi.fn()}
      />,
    );

    const status = screen.getByRole("status");
    expect(player.contains(status)).toBe(true);
    expect(status).toHaveTextContent("12 of 17 tickets for the Vowels prize");

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  });

  test("WHEN nothing is presented fullscreen THEN the notification stays where it is rendered", () => {
    const { container } = renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={vi.fn()}
      />,
    );

    expect(container.contains(screen.getByRole("status"))).toBe(true);
  });

  test("WHEN five seconds pass THEN the notification asks to leave, once", () => {
    const onDone = vi.fn();
    renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={onDone}
      />,
    );

    act(() => vi.advanceTimersByTime(TICKET_TOAST_LIFETIME_MS - 1));
    expect(onDone).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(TICKET_TOAST_LIFETIME_MS).toBe(5000);
  });

  test("WHEN a new moment replaces the shown one THEN its five seconds start again", () => {
    const onDone = vi.fn();
    const { rerender } = renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={onDone}
      />,
    );

    act(() => vi.advanceTimersByTime(4000));
    rerender(
      <TicketToast
        moment={{ ...vowelSoundI, id: 2, ticketsEarned: 13 }}
        onDone={onDone}
      />,
    );
    act(() => vi.advanceTimersByTime(4000));

    expect(onDone).not.toHaveBeenCalled();
  });

  test("WHEN rendered in es THEN the progress is Spanish", () => {
    renderInLocale(
      <TicketToast
        moment={vowelSoundI}
        onDone={vi.fn()}
      />,
      "es",
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "12 de 17 tickets para el premio de Vowels",
    );
  });
});
