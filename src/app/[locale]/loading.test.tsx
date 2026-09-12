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

describe("Home loading shell", () => {
  describe("GIVEN a navigation to the home whose payload has not arrived", () => {
    test("WHEN the shell renders THEN it carries the home's landmarks", () => {
      // Act
      renderShell();

      // Assert
      expect(document.querySelector('[data-testid="home-shell-hero"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="home-shell-section"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="home-shell-ladder"]')).toBeInTheDocument();
    });

    test("WHEN the shell renders THEN the ladder follows the real grid at every breakpoint", () => {
      // Act
      renderShell();

      // Assert
      // The real ladder is `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`; a shell
      // that stacks where the page does not re-lays the page out on arrival.
      const ladder = document.querySelector('[data-testid="home-shell-ladder"]');
      expect(ladder).toHaveClass("grid-cols-1");
      expect(ladder).toHaveClass("md:grid-cols-2");
      expect(ladder).toHaveClass("xl:grid-cols-3");
    });

    test("WHEN the shell renders THEN it announces once and its shapes stay silent", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(document.querySelector('[data-testid="home-shell-shapes"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });
});
