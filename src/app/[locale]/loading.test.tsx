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
      expect(document.querySelector('[data-testid="home-shell-card"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="home-shell-levels"]')).toBeInTheDocument();
    });

    test("WHEN the shell renders THEN the hero follows the editorial two-column grid", () => {
      // Act
      renderShell();

      // Assert
      // The real hero is one column that opens to twelve at `lg`, with the copy
      // on seven and the card on five; a shell that disagreed would re-lay the
      // page out on arrival.
      const hero = document.querySelector('[data-testid="home-shell-hero"]');
      expect(hero).toHaveClass("grid-cols-1");
      expect(hero).toHaveClass("lg:grid-cols-12");
    });

    test("WHEN the shell renders THEN it traces one levels row per course the catalog ships", () => {
      // Act
      renderShell();

      // Assert
      const rows = document.querySelectorAll('[data-testid="home-shell-levels"] > *');
      expect(rows).toHaveLength(2);
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
