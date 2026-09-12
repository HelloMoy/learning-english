import messages from "@/messages/en.json";

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test } from "vitest";

import { LoadingStatus } from "./loading-status";

const renderWithLocale = (locale: string, localeMessages: typeof messages) =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={localeMessages}
    >
      <LoadingStatus />
    </NextIntlClientProvider>,
  );

describe("LoadingStatus", () => {
  describe("GIVEN a route shell that is waiting for its page", () => {
    test("WHEN rendered THEN one live region announces that the page is loading", () => {
      // Act
      renderWithLocale("en", messages);

      // Assert
      // A live region is announced by its CONTENT, not by its accessible name —
      // `status` is not a name-from-content role, so asserting the name would
      // pass on an empty region and fail on a correct one.
      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent(messages.Components.LoadingStatus.label);
    });

    test("WHEN rendered THEN it is the only live region, so a shell announces once", () => {
      // Act
      renderWithLocale("en", messages);

      // Assert
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });
  });

  describe("GIVEN a shell rendered under a non-default locale", () => {
    test("WHEN the locale is Spanish THEN the announcement is that locale's copy", async () => {
      // Arrange
      const spanish = (await import("@/messages/es.json")).default;

      // Act
      renderWithLocale("es", spanish as typeof messages);

      // Assert
      expect(screen.getByRole("status")).toHaveTextContent(spanish.Components.LoadingStatus.label);
    });
  });
});
