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

describe("Module overview loading shell", () => {
  describe("GIVEN a navigation to a module whose payload has not arrived", () => {
    test("WHEN the shell renders THEN it carries the module overview's landmarks", () => {
      // Act
      renderShell();

      // Assert
      expect(document.querySelector('[data-testid="module-shell-header"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="module-shell-lessons"]')).toBeInTheDocument();
    });

    test("WHEN the shell renders THEN it stands in for a list, not a single row", () => {
      // Act
      renderShell();

      // Assert
      expect(
        document.querySelectorAll('[data-testid="module-shell-lesson-row"]').length,
      ).toBeGreaterThan(3);
    });

    test("WHEN the shell renders THEN it announces once and its shapes stay silent", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(document.querySelector('[data-testid="module-shell-shapes"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });
});
