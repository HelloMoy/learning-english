import { CLIP_GAP_MS, type PlayableClip } from "@/hooks/use-clip-sequence/use-clip-sequence";
import { MINIMAL_PAIR_CLIPS } from "@/lib/minimal-pair-clips/minimal-pair-clips";

import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";
import pt from "../../messages/pt.json";
import { VowelLengthCard } from "./vowel-length-card";

const MESSAGES = { en, es, pt } as const;

type FakeClip = PlayableClip & { src: string; finish: () => void };

/** Stands in for `new Audio(src)`: jsdom has no media playback. */
function makeAudioFactory({ refusesPlayback = false } = {}) {
  const created: FakeClip[] = [];
  const createAudio = (src: string): FakeClip => {
    const clip: FakeClip = {
      src,
      onended: null,
      play: vi.fn(() =>
        refusesPlayback ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve(),
      ),
      pause: vi.fn(),
      finish: () => clip.onended?.(new Event("ended")),
    };
    created.push(clip);
    return clip;
  };
  return { createAudio, created };
}

function renderInLocale(ui: ReactElement, locale: keyof typeof MESSAGES = "en") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
    >
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("VowelLengthCard", () => {
  describe("GIVEN the card in its new-visitor variant", () => {
    test("WHEN rendered THEN both words show with their transcriptions", () => {
      renderInLocale(<VowelLengthCard variant="hear-the-difference" />);

      expect(screen.getByTestId("vowel-row-ship")).toHaveTextContent("ship");
      expect(screen.getByTestId("vowel-row-ship")).toHaveTextContent("/ʃɪp/");
      expect(screen.getByTestId("vowel-row-sheep")).toHaveTextContent("sheep");
      expect(screen.getByTestId("vowel-row-sheep")).toHaveTextContent("/ʃip/");
    });

    test("WHEN rendered THEN the long vowel's track is the longer one", () => {
      renderInLocale(<VowelLengthCard variant="hear-the-difference" />);

      expect(screen.getByTestId("vowel-track-ship")).toHaveAttribute("data-length", "short");
      expect(screen.getByTestId("vowel-track-sheep")).toHaveAttribute("data-length", "long");
    });

    test("WHEN rendered THEN the eyebrow invites the visitor to hear the difference", () => {
      renderInLocale(<VowelLengthCard variant="hear-the-difference" />);

      expect(screen.getByText("Hear the difference")).toBeInTheDocument();
    });
  });

  describe("GIVEN the card in its returning variant", () => {
    test("WHEN rendered THEN only the eyebrow changes, to a quick review", () => {
      renderInLocale(<VowelLengthCard variant="quick-review" />);

      expect(screen.getByText("Quick review")).toBeInTheDocument();
      expect(screen.queryByText("Hear the difference")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play ship" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a word button", () => {
    test("WHEN pressed THEN its recording plays and the button reports it is pressed", async () => {
      const user = userEvent.setup();
      const { createAudio, created } = makeAudioFactory();
      renderInLocale(
        <VowelLengthCard
          variant="hear-the-difference"
          createAudio={createAudio}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Play sheep" }));

      expect(created.map((clip) => clip.src)).toEqual([MINIMAL_PAIR_CLIPS.sheep]);
      expect(screen.getByRole("button", { name: "Play sheep" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        within(screen.getByTestId("vowel-track-sheep")).getByTestId("vowel-fill"),
      ).toBeVisible();
    });

    test("WHEN the recording ends THEN the button is released and the fill is gone", async () => {
      const user = userEvent.setup();
      const { createAudio, created } = makeAudioFactory();
      renderInLocale(
        <VowelLengthCard
          variant="hear-the-difference"
          createAudio={createAudio}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Play sheep" }));

      act(() => created[0]!.finish());

      expect(screen.getByRole("button", { name: "Play sheep" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(
        within(screen.getByTestId("vowel-track-sheep")).queryByTestId("vowel-fill"),
      ).not.toBeInTheDocument();
    });

    test("WHEN the browser refuses playback THEN every word stays released", async () => {
      const user = userEvent.setup();
      const { createAudio } = makeAudioFactory({ refusesPlayback: true });
      renderInLocale(
        <VowelLengthCard
          variant="hear-the-difference"
          createAudio={createAudio}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Play ship" }));

      for (const name of ["Play ship", "Play sheep"]) {
        expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
      }
    });
  });

  describe("GIVEN the Play both control", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("WHEN pressed THEN ship plays first and sheep follows it", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { createAudio, created } = makeAudioFactory();
      renderInLocale(
        <VowelLengthCard
          variant="hear-the-difference"
          createAudio={createAudio}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Play both" }));
      expect(screen.getByRole("button", { name: "Play ship" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      act(() => created[0]!.finish());
      await act(async () => vi.advanceTimersByTime(CLIP_GAP_MS));

      expect(created.map((clip) => clip.src)).toEqual([
        MINIMAL_PAIR_CLIPS.ship,
        MINIMAL_PAIR_CLIPS.sheep,
      ]);
      expect(screen.getByRole("button", { name: "Play sheep" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  describe("GIVEN the learner's language", () => {
    test("WHEN rendered in es THEN the anchor note compares the vowels to Spanish words", () => {
      renderInLocale(<VowelLengthCard variant="hear-the-difference" />, "es");

      const note = screen.getByTestId("vowel-anchor-note");
      expect(note).toHaveTextContent("sí");
      expect(note).toHaveTextContent("sé");
      expect(screen.getByRole("button", { name: "Reproducir ship" })).toBeInTheDocument();
    });

    test("WHEN rendered in pt THEN the note compares them to Portuguese words and the English words stay", () => {
      renderInLocale(<VowelLengthCard variant="hear-the-difference" />, "pt");

      const note = screen.getByTestId("vowel-anchor-note");
      expect(note).toHaveTextContent("vi");
      expect(note).toHaveTextContent("vê");
      expect(screen.getByTestId("vowel-row-sheep")).toHaveTextContent("sheep");
    });
  });
});
