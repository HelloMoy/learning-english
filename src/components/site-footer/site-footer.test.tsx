import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  describe("GIVEN the footer is rendered", () => {
    test("WHEN queried THEN it is the page's contentinfo landmark", () => {
      // Act
      renderInLocale(<SiteFooter />);

      // Assert — a landmark is what lets a screen-reader user reach the legal
      // links without walking the whole page.
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    test("WHEN queried THEN its navigation is named", () => {
      // Act
      renderInLocale(<SiteFooter />);

      // Assert
      expect(screen.getByRole("navigation", { name: "Legal" })).toBeInTheDocument();
    });

    test("WHEN queried THEN it links to both legal documents", () => {
      // Arrange — the href is asserted without a locale prefix on purpose.
      // next-intl adds the prefix from the router context, which jsdom has no
      // equivalent of, so every locale-aware Link renders its bare href here
      // (`Brand` asserts `/` for the same reason). That the prefix survives
      // navigation is a real-browser property, covered by the e2e suite.

      // Act
      renderInLocale(<SiteFooter />);

      // Assert
      expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
      expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    });
  });

  describe("GIVEN a reader whose locale is not the default", () => {
    test("WHEN rendered in es THEN both labels are Spanish", () => {
      // Act
      renderInLocale(<SiteFooter />, "es");

      // Assert
      expect(screen.getByRole("link", { name: "Privacidad" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Términos" })).toBeInTheDocument();
    });

    test("WHEN rendered in pt THEN both labels are Portuguese", () => {
      // Act
      renderInLocale(<SiteFooter />, "pt");

      // Assert
      expect(screen.getByRole("link", { name: "Privacidade" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Termos" })).toBeInTheDocument();
    });
  });
});
