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
    test("WHEN the shell renders THEN it traces the hero, the carousel AND the progress panel", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getByTestId("course-shell-hero")).toBeInTheDocument();
      expect(screen.getByTestId("course-shell-carousel")).toBeInTheDocument();
      expect(screen.getByTestId("course-shell-panel")).toBeInTheDocument();
    });

    test("WHEN the shell renders THEN the carousel previews a selected poster between neighbours", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByTestId("course-shell-poster").length).toBeGreaterThanOrEqual(3);
    });

    test("WHEN the shell renders THEN it announces once and its shapes stay silent", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(screen.getByTestId("course-shell-shapes")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
