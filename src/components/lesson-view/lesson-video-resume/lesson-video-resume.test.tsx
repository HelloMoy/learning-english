import "@testing-library/jest-dom/vitest";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonVideoResume } from "./lesson-video-resume";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("LessonVideoResume", () => {
  beforeEach(() => {
    // Echo the key, and append any ICU values so interpolated copy
    // (`resumeFrom` carries the MM:SS timestamp) stays assertable without
    // coupling the test to real translated strings.
    mockUseTranslations.mockReturnValue(((key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${Object.values(values).join(" ")}`) as never);
  });

  describe("GIVEN a position that passes the thresholds", () => {
    test("WHEN rendered THEN it shows the resume label with formatted MM:SS and the restart option", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      render(
        <LessonVideoResume
          positionSeconds={180}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(screen.getByRole("dialog", { name: "dialogLabel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "resumeCta" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "restartCta" })).toBeInTheDocument();
      expect(screen.getByText(`resumeFrom 03:00`)).toBeInTheDocument();
    });

    test("WHEN the user clicks Resume THEN onResume is called with the saved position", async () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();
      const user = userEvent.setup();

      render(
        <LessonVideoResume
          positionSeconds={180}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );
      await user.click(screen.getByRole("button", { name: "resumeCta" }));

      expect(onResume).toHaveBeenCalledWith(180);
      expect(onRestart).not.toHaveBeenCalled();
    });

    test("WHEN the user clicks Restart THEN onRestart is called (and onResume is not)", async () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();
      const user = userEvent.setup();

      render(
        <LessonVideoResume
          positionSeconds={180}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );
      await user.click(screen.getByRole("button", { name: "restartCta" }));

      expect(onRestart).toHaveBeenCalledTimes(1);
      expect(onResume).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a position that does NOT pass the thresholds", () => {
    test("WHEN position < 30s THEN nothing is rendered", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      const { container } = render(
        <LessonVideoResume
          positionSeconds={5}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(container).toBeEmpty();
    });

    test("WHEN position is within last 10s of durationSeconds THEN nothing is rendered", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      const { container } = render(
        <LessonVideoResume
          positionSeconds={595}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(container).toBeEmpty();
    });
  });

  describe("GIVEN any passing position", () => {
    test("WHEN rendered THEN the dialog has aria-live=polite (does not steal focus)", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      render(
        <LessonVideoResume
          positionSeconds={120}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("GIVEN MM:SS formatting", () => {
    test("WHEN seconds = 180 THEN it formats as 03:00", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      render(
        <LessonVideoResume
          positionSeconds={180}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(screen.getByText(`resumeFrom 03:00`)).toBeInTheDocument();
    });

    test("WHEN seconds = 65 THEN it formats as 01:05", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      render(
        <LessonVideoResume
          positionSeconds={65}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(screen.getByText(`resumeFrom 01:05`)).toBeInTheDocument();
    });

    test("WHEN seconds = 45 THEN it formats as 00:45", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      render(
        <LessonVideoResume
          positionSeconds={45}
          durationSeconds={600}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(screen.getByText(`resumeFrom 00:45`)).toBeInTheDocument();
    });

    test("WHEN called with a faker random integer THEN it never throws", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();
      const seconds = faker.number.int({ min: 30, max: 590 });

      expect(() =>
        render(
          <LessonVideoResume
            positionSeconds={seconds}
            durationSeconds={Math.max(seconds + 30, 600)}
            onResume={onResume}
            onRestart={onRestart}
          />,
        ),
      ).not.toThrow();
    });
  });

  describe("GIVEN a trivial lesson duration (shorter than the resume threshold window)", () => {
    test("WHEN a position near the end is requested THEN it does not render the overlay", () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();

      const { container } = render(
        <LessonVideoResume
          positionSeconds={5}
          durationSeconds={5}
          onResume={onResume}
          onRestart={onRestart}
        />,
      );

      expect(container).toBeEmpty();
    });
  });
});
