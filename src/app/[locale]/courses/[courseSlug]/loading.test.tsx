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
    test("WHEN the shell renders THEN it traces the continue tile AND the course progress tile", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getByTestId("course-shell-continue")).toBeInTheDocument();
      expect(screen.getByTestId("course-shell-course")).toBeInTheDocument();
    });

    test("WHEN the shell renders THEN it previews a row of lesson tiles AND no carousel", () => {
      // Act
      renderShell();

      // Assert
      expect(screen.getAllByTestId("course-shell-lesson")).toHaveLength(5);
      expect(screen.queryByTestId("course-shell-carousel")).toBeNull();
      expect(screen.queryByTestId("course-shell-panel")).toBeNull();
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
