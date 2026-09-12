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

describe("Course overview loading shell", () => {
  describe("GIVEN a navigation to a course whose payload has not arrived", () => {
    test("WHEN the shell renders THEN it carries the course overview's landmarks", () => {
      // Act
      renderShell();

      // Assert
      expect(document.querySelector('[data-testid="course-shell-header"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="course-shell-modules"]')).toBeInTheDocument();
    });

    test("WHEN the shell renders THEN it previews more than one module", () => {
      // Act
      renderShell();

      // Assert
      // A single card would under-fill the page and let the real list push the
      // fold down as it arrives, which is the shift the shell exists to absorb.
      expect(
        document.querySelectorAll('[data-testid="course-shell-module-card"]').length,
      ).toBeGreaterThan(1);
    });

    test("WHEN the shell renders THEN it announces once and its shapes stay silent", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(document.querySelector('[data-testid="course-shell-shapes"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });
});
