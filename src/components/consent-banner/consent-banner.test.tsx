import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { ConsentBanner } from "./consent-banner";

/**
 * Guards the `product-analytics` capability's "The consent banner offers
 * acceptance and rejection on equal terms".
 */

const banner = () => screen.queryByRole("region", { name: "Privacy choices" });

describe("ConsentBanner", () => {
  describe("GIVEN there is nothing to ask", () => {
    test("WHEN product analytics never started THEN nothing is rendered", () => {
      renderInLocale(<ConsentBanner />);

      expect(banner()).not.toBeInTheDocument();
    });

    test.each(["granted", "denied"] as const)(
      "WHEN the visitor already answered %s THEN nothing is rendered",
      (answer) => {
        givenProductAnalytics(answer);

        renderInLocale(<ConsentBanner />);

        expect(banner()).not.toBeInTheDocument();
      },
    );
  });

  describe("GIVEN a visitor who has not answered", () => {
    test("WHEN rendered THEN it says what accepting and declining mean", () => {
      givenProductAnalytics("pending");

      renderInLocale(<ConsentBanner />);

      expect(banner()).toHaveTextContent(/a recording of your session, linked to your account/);
      expect(banner()).toHaveTextContent(
        /If you decline, your visit is still counted, anonymously/,
      );
    });

    test("WHEN rendered THEN it links to the privacy policy", () => {
      givenProductAnalytics("pending");

      renderInLocale(<ConsentBanner />);

      // Bare href on purpose: next-intl adds the locale from the router
      // context, which jsdom has no equivalent of (see `SiteFooter`'s test).
      expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
        "href",
        "/privacy",
      );
    });

    test("WHEN rendered THEN accepting and declining are the same kind of button", () => {
      givenProductAnalytics("pending");

      renderInLocale(<ConsentBanner />);

      const accept = screen.getByRole("button", { name: "Accept" });
      const decline = screen.getByRole("button", { name: "Decline" });
      expect(accept.dataset.variant).toBe(decline.dataset.variant);
      expect(accept.dataset.size).toBe(decline.dataset.size);
    });

    test("WHEN the visitor accepts THEN PostHog is opted in and the banner leaves", async () => {
      const user = userEvent.setup();
      const client = givenProductAnalytics("pending");
      renderInLocale(<ConsentBanner />);

      await user.click(screen.getByRole("button", { name: "Accept" }));

      expect(client.opt_in_capturing).toHaveBeenCalledOnce();
      expect(banner()).not.toBeInTheDocument();
    });

    test("WHEN the visitor declines THEN PostHog is opted out and the banner leaves", async () => {
      const user = userEvent.setup();
      const client = givenProductAnalytics("pending");
      renderInLocale(<ConsentBanner />);

      await user.click(screen.getByRole("button", { name: "Decline" }));

      expect(client.opt_out_capturing).toHaveBeenCalledOnce();
      expect(banner()).not.toBeInTheDocument();
    });

    test("WHEN using only the keyboard THEN declining is reachable and works", async () => {
      const user = userEvent.setup();
      const client = givenProductAnalytics("pending");
      renderInLocale(<ConsentBanner />);

      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Decline" })).toHaveFocus();
      await user.keyboard("{Enter}");

      expect(client.opt_out_capturing).toHaveBeenCalledOnce();
    });
  });

  describe("GIVEN a reader whose locale is not the default", () => {
    test("WHEN rendered in es THEN the question is in Spanish", () => {
      givenProductAnalytics("pending");

      renderInLocale(<ConsentBanner />, "es");

      expect(screen.getByRole("region", { name: "Opciones de privacidad" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Aceptar" })).toBeInTheDocument();
    });

    test("WHEN rendered in pt THEN the question is in Portuguese", () => {
      givenProductAnalytics("pending");

      renderInLocale(<ConsentBanner />, "pt");

      expect(screen.getByRole("region", { name: "Opções de privacidade" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Recusar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Aceitar" })).toBeInTheDocument();
    });
  });
});
