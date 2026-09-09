import "@testing-library/jest-dom/vitest";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonVideoResumeOverlay } from "./lesson-video-resume-overlay";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Renders the overlay the way the player does — inside a positioned box, with
 * page content as a sibling so "it is not a modal" is assertable.
 */
function renderOverlay({
  positionSeconds = 180,
  onResume = vi.fn(),
  onRestart = vi.fn(),
}: {
  positionSeconds?: number;
  onResume?: () => void;
  onRestart?: () => void;
} = {}) {
  const view = render(
    <div>
      <a href="https://example.com/outline">Course outline</a>
      <div data-testid="player-box">
        <LessonVideoResumeOverlay
          positionSeconds={positionSeconds}
          onResume={onResume}
          onRestart={onRestart}
        />
      </div>
    </div>,
  );

  return { ...view, onResume, onRestart };
}

describe("LessonVideoResumeOverlay", () => {
  beforeEach(() => {
    // Echo the key, and append any ICU values so interpolated copy
    // (`resumeFrom` carries the MM:SS timestamp) stays assertable without
    // coupling the test to real translated strings.
    mockUseTranslations.mockReturnValue(((key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${Object.values(values).join(" ")}`) as never);
  });

  describe("GIVEN the overlay is offering a saved position", () => {
    test("WHEN it renders THEN it is a labelled dialog with both actions", () => {
      renderOverlay();

      expect(screen.getByRole("dialog", { name: "dialogLabel" })).toBeInTheDocument();
      expect(screen.getByText("description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "resumeCta" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "restartCta" })).toBeInTheDocument();
    });

    test("WHEN it renders THEN it shows the position as MM:SS", () => {
      renderOverlay({ positionSeconds: 57 });

      expect(screen.getByText("resumeFrom 00:57")).toBeInTheDocument();
    });

    /*
     * On a phone the player is a 16:9 box barely 200px tall and the card no
     * longer paints its heading or its description — they are there for
     * assistive technology only. jsdom applies no stylesheet, so which of them
     * a sighted learner sees is a question only a browser can answer, and
     * `e2e/lesson-playback-resume.spec.ts` answers it by measuring the card
     * against the player. What belongs here is the half that CSS must never be
     * able to take away.
     */
    test("WHEN it renders THEN the heading and description are in the document, not conditionally rendered", () => {
      // The compact form is a stylesheet concern. Dropping either element from
      // the tree instead would take the dialog's name and description with it.
      renderOverlay();

      expect(screen.getByRole("heading", { name: "dialogLabel" })).toBeInTheDocument();
      expect(screen.getByText("description")).toBeInTheDocument();
    });

    test("WHEN it renders THEN the dialog's name and description resolve to those elements", () => {
      renderOverlay();

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleName("dialogLabel");
      expect(dialog).toHaveAccessibleDescription("description");
    });

    test("WHEN it renders THEN the card cannot outgrow the player box", () => {
      // The last-resort bound: a longer translation scrolls inside the card
      // rather than spilling past the player, where the lesson wrapper's
      // `overflow: hidden` would cut it off.
      const { container } = renderOverlay();
      const card = container.querySelector("[role='dialog'] > div");

      expect(card).toHaveClass("max-h-full", "overflow-y-auto");
    });

    test("WHEN the position is an arbitrary number of seconds THEN it is formatted, not printed raw", () => {
      const positionSeconds = faker.number.int({ min: 60, max: 3599 });
      const minutes = Math.floor(positionSeconds / 60);
      const seconds = positionSeconds % 60;
      const expected = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      renderOverlay({ positionSeconds });

      expect(screen.getByText(`resumeFrom ${expected}`)).toBeInTheDocument();
    });

    test("WHEN it renders THEN focus lands on the Resume action", () => {
      renderOverlay();

      expect(screen.getByRole("button", { name: "resumeCta" })).toHaveFocus();
    });

    test("WHEN it renders THEN it stays inside the player box", () => {
      renderOverlay();

      expect(screen.getByTestId("player-box")).toContainElement(screen.getByRole("dialog"));
    });
  });

  describe("GIVEN the overlay is NOT a modal", () => {
    test("WHEN it renders THEN it does not hide the page behind it", () => {
      renderOverlay();

      expect(screen.getByRole("link", { name: "Course outline" })).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false");
      for (const element of document.body.children) {
        expect(element).not.toHaveAttribute("aria-hidden");
      }
    });

    test("WHEN it renders THEN it is not portalled out of its parent", () => {
      renderOverlay();

      expect(document.body.children).toHaveLength(1);
    });
  });

  describe("GIVEN the learner answers the offer", () => {
    test("WHEN Resume is activated THEN onResume fires and onRestart does not", async () => {
      const user = userEvent.setup();
      const { onResume, onRestart } = renderOverlay();

      await user.click(screen.getByRole("button", { name: "resumeCta" }));

      expect(onResume).toHaveBeenCalledTimes(1);
      expect(onRestart).not.toHaveBeenCalled();
    });

    test("WHEN Restart is activated THEN onRestart fires and onResume does not", async () => {
      const user = userEvent.setup();
      const { onResume, onRestart } = renderOverlay();

      await user.click(screen.getByRole("button", { name: "restartCta" }));

      expect(onRestart).toHaveBeenCalledTimes(1);
      expect(onResume).not.toHaveBeenCalled();
    });

    test("WHEN it merely renders THEN neither callback has fired", () => {
      const { onResume, onRestart } = renderOverlay();

      expect(onResume).not.toHaveBeenCalled();
      expect(onRestart).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the learner dismisses the offer", () => {
    test("WHEN Escape is pressed THEN it is treated as a restart", async () => {
      const user = userEvent.setup();
      const { onResume, onRestart } = renderOverlay();

      await user.keyboard("{Escape}");

      expect(onRestart).toHaveBeenCalledTimes(1);
      expect(onResume).not.toHaveBeenCalled();
    });

    test("WHEN the close control is activated THEN it is treated as a restart", async () => {
      const user = userEvent.setup();
      const { onResume, onRestart } = renderOverlay();

      await user.click(screen.getByRole("button", { name: "dismissLabel" }));

      expect(onRestart).toHaveBeenCalledTimes(1);
      expect(onResume).not.toHaveBeenCalled();
    });
  });
});
