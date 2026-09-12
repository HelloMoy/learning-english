import messages from "@/messages/en.json";

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test } from "vitest";

import Loading from "./loading";

const renderShell = () =>
  render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      <Loading />
    </NextIntlClientProvider>,
  );

describe("Lesson loading shell", () => {
  describe("GIVEN a navigation to a lesson whose payload has not arrived", () => {
    test("WHEN the shell renders THEN it carries every landmark of the lesson page", () => {
      // Act
      renderShell();

      // Assert
      // This is the shell that matters most: without it the learner stays on the
      // page they came from and reads it as a lesson that has no video.
      for (const landmark of [
        "lesson-shell-outline",
        "lesson-shell-breadcrumb",
        "lesson-shell-frame",
        "lesson-shell-title",
        "lesson-shell-tabs",
        "lesson-shell-close",
      ]) {
        expect(document.querySelector(`[data-testid="${landmark}"]`)).toBeInTheDocument();
      }
    });

    test("WHEN the shell renders THEN the video frame holds its 16:9 box", () => {
      // Act
      renderShell();

      // Assert
      expect(document.querySelector('[data-testid="lesson-shell-frame"]')).toHaveClass(
        "aspect-video",
      );
    });

    test("WHEN the shell renders THEN it reproduces the page's responsive grid", () => {
      // Act
      renderShell();

      // Assert
      // The real page stacks below `lg` and becomes `260px 1fr 280px` above it.
      const grid = document.querySelector('[data-testid="lesson-shell-grid"]');
      expect(grid).toHaveClass("lg:grid-cols-[260px_1fr_280px]");
    });

    test("WHEN the shell renders THEN it announces once and its shapes stay silent", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(document.querySelector('[data-testid="lesson-shell-shapes"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });
});
