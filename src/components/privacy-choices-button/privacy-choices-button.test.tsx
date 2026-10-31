import { ConsentBanner } from "@/components/consent-banner/consent-banner";
import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { PrivacyChoicesButton } from "./privacy-choices-button";

/**
 * Guards the `product-analytics` capability's "The choice can be changed at
 * any time".
 */

describe("PrivacyChoicesButton", () => {
  test("WHEN product analytics never started THEN there is no control, since there is no choice", () => {
    renderInLocale(<PrivacyChoicesButton />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test.each(["granted", "denied", "pending"] as const)(
    "WHEN the visitor's answer is %s THEN the control is offered",
    (answer) => {
      givenProductAnalytics(answer);

      renderInLocale(<PrivacyChoicesButton />);

      expect(screen.getByRole("button", { name: "Privacy choices" })).toBeInTheDocument();
    },
  );

  test("WHEN a visitor who already answered activates it THEN the banner asks again", async () => {
    const user = userEvent.setup();
    givenProductAnalytics("granted");
    renderInLocale(
      <>
        <ConsentBanner />
        <PrivacyChoicesButton />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Privacy choices" }));

    expect(screen.getByRole("region", { name: "Privacy choices" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
  });

  test.each([
    ["es", "Opciones de privacidad"],
    ["pt", "Opções de privacidade"],
  ] as const)("WHEN rendered in %s THEN the label is translated", (locale, label) => {
    givenProductAnalytics("granted");

    renderInLocale(<PrivacyChoicesButton />, locale);

    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  });
});
