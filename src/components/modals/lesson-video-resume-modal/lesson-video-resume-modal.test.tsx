import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonVideoResumeModal, type LessonVideoResumeChoice } from "./lesson-video-resume-modal";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Mounts the provider and opens the modal imperatively, the way a real caller
 * does.
 *
 * The pending choice is returned **wrapped in an object**, never bare: an
 * `async` helper returning a promise would adopt it, so `await showResumeModal()`
 * would block until the learner clicked — which is exactly what the test has
 * not done yet.
 */
const showResumeModal = async (
  positionSeconds: number,
): Promise<{ choice: Promise<LessonVideoResumeChoice> }> => {
  render(<NiceModal.Provider />);

  let choice!: Promise<LessonVideoResumeChoice>;
  await act(async () => {
    choice = NiceModal.show(LessonVideoResumeModal, {
      positionSeconds,
    }) as Promise<LessonVideoResumeChoice>;
  });

  return { choice };
};

describe("LessonVideoResumeModal", () => {
  beforeEach(() => {
    // Echo the key, and append any ICU values so interpolated copy
    // (`resumeFrom` carries the MM:SS timestamp) stays assertable without
    // coupling the test to real translated strings.
    mockUseTranslations.mockReturnValue(((key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${Object.values(values).join(" ")}`) as never);
  });

  describe("GIVEN the modal is shown for a saved position", () => {
    test("WHEN opened THEN it renders a dialog with a title, a description and both actions", async () => {
      await showResumeModal(180);

      expect(screen.getByRole("dialog", { name: "dialogLabel" })).toBeInTheDocument();
      expect(screen.getByText("description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "resumeCta" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "restartCta" })).toBeInTheDocument();
    });

    test("WHEN opened THEN it is a real modal that hides the page behind it", async () => {
      await showResumeModal(180);

      const dialog = screen.getByRole("dialog");
      const background = [...document.body.children].filter((child) => !child.contains(dialog));

      expect(background.length).toBeGreaterThan(0);
      for (const element of background) {
        expect(element).toHaveAttribute("aria-hidden", "true");
      }
    });
  });

  describe("GIVEN the learner picks an action", () => {
    test("WHEN Resume is clicked THEN it resolves with the saved position and closes", async () => {
      const user = userEvent.setup();
      const { choice } = await showResumeModal(180);

      await user.click(screen.getByRole("button", { name: "resumeCta" }));

      await expect(choice).resolves.toEqual({ action: "resume", seconds: 180 });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("WHEN Restart is clicked THEN it resolves with restart and closes", async () => {
      const user = userEvent.setup();
      const { choice } = await showResumeModal(180);

      await user.click(screen.getByRole("button", { name: "restartCta" }));

      await expect(choice).resolves.toEqual({ action: "restart" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN the learner leaves without choosing", () => {
    test("WHEN Escape is pressed THEN it resolves as dismissed and closes", async () => {
      const user = userEvent.setup();
      const { choice } = await showResumeModal(180);

      await user.keyboard("{Escape}");

      await expect(choice).resolves.toEqual({ action: "dismissed" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("WHEN the backdrop is clicked THEN it resolves as dismissed and closes", async () => {
      const user = userEvent.setup();
      const { choice } = await showResumeModal(180);

      await user.click(document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement);

      await expect(choice).resolves.toEqual({ action: "dismissed" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("WHEN the close button is clicked THEN it resolves as dismissed and closes", async () => {
      const user = userEvent.setup();
      const { choice } = await showResumeModal(180);

      await user.click(screen.getByRole("button", { name: "closeLabel" }));

      await expect(choice).resolves.toEqual({ action: "dismissed" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN MM:SS formatting", () => {
    test("WHEN seconds = 180 THEN it reads 03:00", async () => {
      await showResumeModal(180);

      expect(screen.getByText("resumeFrom 03:00")).toBeInTheDocument();
    });

    test("WHEN seconds = 65 THEN it reads 01:05", async () => {
      await showResumeModal(65);

      expect(screen.getByText("resumeFrom 01:05")).toBeInTheDocument();
    });

    test("WHEN seconds = 45 THEN it reads 00:45", async () => {
      await showResumeModal(45);

      expect(screen.getByText("resumeFrom 00:45")).toBeInTheDocument();
    });

    test("WHEN seconds = 3661 THEN the minutes keep counting past an hour", async () => {
      await showResumeModal(3661);

      expect(screen.getByText("resumeFrom 61:01")).toBeInTheDocument();
    });

    test("WHEN opened with an arbitrary position THEN it resolves with exactly that position", async () => {
      const user = userEvent.setup();
      const seconds = faker.number.int({ min: 30, max: 3590 });
      const { choice } = await showResumeModal(seconds);

      await user.click(screen.getByRole("button", { name: "resumeCta" }));

      await expect(choice).resolves.toEqual({ action: "resume", seconds });
    });
  });
});
