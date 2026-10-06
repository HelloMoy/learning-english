import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { RouteLink } from "./route-link";

const currentPathname = vi.fn<() => string | null>();

type IntlLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  transitionTypes?: string[];
  children: ReactNode;
};

/**
 * next-intl's `Link` stands in as a plain anchor that shows the
 * `transitionTypes` it was handed — the one thing `RouteLink` adds. Whether
 * next-intl then prefixes the locale is next-intl's business.
 */
vi.mock("@/i18n/intl-navigation", () => ({
  usePathname: () => currentPathname(),
  Link: ({ href, transitionTypes, children, ...anchorProps }: IntlLinkProps) => (
    <a
      href={href}
      data-transition-types={transitionTypes?.join(" ")}
      {...anchorProps}
    >
      {children}
    </a>
  ),
}));

function renderLinkOn(pathname: string | null, link: Partial<IntlLinkProps> & { href: string }) {
  currentPathname.mockReturnValue(pathname);
  const label = faker.lorem.words(2);
  render(<RouteLink {...link}>{label}</RouteLink>);
  return screen.getByRole("link", { name: label });
}

describe("RouteLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN a link to another route", () => {
    test.each([
      ["/learning", "/courses", "route-slide-forward"],
      ["/courses", "/courses/basic-course/about", "route-depth-in"],
      ["/courses/basic-course/modules/vowels", "/courses/basic-course/progress", "route-depth-out"],
      ["/", "/sign-in", "route-rise"],
      ["/profile", "/privacy", "route-fade"],
    ])("WHEN rendered on %s pointing at %s THEN it carries %s", (pathname, href, type) => {
      const link = renderLinkOn(pathname, { href });

      expect(link).toHaveAttribute("data-transition-types", type);
    });

    test("WHEN the caller names its own transition types THEN those are passed on", () => {
      const link = renderLinkOn("/learning", { href: "/courses", transitionTypes: ["route-fade"] });

      expect(link).toHaveAttribute("data-transition-types", "route-fade");
    });

    test("WHEN rendered THEN the anchor keeps its destination and its own props", () => {
      const className = faker.lorem.word();

      const link = renderLinkOn("/learning", { href: "/courses", className });

      expect(link).toHaveAttribute("href", "/courses");
      expect(link).toHaveClass(className);
    });
  });

  describe("GIVEN a link with no route motion", () => {
    test.each([
      ["the current route", "/learning", "/learning"],
      ["an external URL", "/learning", "https://example.com"],
    ])("WHEN it points at %s THEN it carries no transition type", (_, pathname, href) => {
      const link = renderLinkOn(pathname, { href });

      expect(link).not.toHaveAttribute("data-transition-types");
    });

    test("WHEN the current pathname is unknown THEN it still renders, without a type", () => {
      const link = renderLinkOn(null, { href: "/courses" });

      expect(link).toHaveAttribute("href", "/courses");
      expect(link).not.toHaveAttribute("data-transition-types");
    });
  });
});
