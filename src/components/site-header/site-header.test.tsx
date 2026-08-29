import { usePathname } from "@/i18n/navigation";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { sectionKey, SiteHeader } from "./site-header";

/**
 * Mock the next-intl and navigation hooks directly rather than standing up
 * real providers — the routing-to-section mapping is what these tests are
 * about. Returning the key as the label keeps assertions decoupled from
 * translated copy.
 *
 * The header composes `LocaleSwitcher` and `ThemeToggle`, so their hooks
 * (`useLocale`, `useRouter`, `useTheme`) have to be stubbed too. Rendering
 * the real children rather than stubbing the components keeps the test
 * honest about what the header actually mounts.
 */
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUsePathname = vi.mocked(usePathname);

describe("sectionKey", () => {
  describe("GIVEN a lesson route", () => {
    test("WHEN resolved THEN it reports the lesson section", () => {
      expect(sectionKey("/courses/c/modules/m/lessons/abc")).toBe("sectionLesson");
    });
  });

  describe("GIVEN a module route", () => {
    test("WHEN resolved THEN it reports the module section", () => {
      expect(sectionKey("/courses/c/modules/m")).toBe("sectionModule");
    });
  });

  describe("GIVEN a course route", () => {
    test("WHEN resolved THEN it reports the course section", () => {
      expect(sectionKey("/courses/c")).toBe("sectionCourse");
    });
  });

  describe("GIVEN the home route", () => {
    test("WHEN resolved THEN it falls back to the home section", () => {
      expect(sectionKey("/")).toBe("sectionHome");
    });
  });

  describe("GIVEN a lesson route that also contains /modules/ and /courses/", () => {
    test("WHEN resolved THEN the deepest segment wins", () => {
      // Order matters: a lesson URL contains every shallower segment, so a
      // naive check would report "course" for a lesson page.
      expect(sectionKey("/courses/c/modules/m/lessons/l")).toBe("sectionLesson");
    });
  });
});

describe("SiteHeader", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    mockUsePathname.mockReturnValue("/");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN any route", () => {
    test("WHEN rendered THEN it exposes a labelled banner landmark", () => {
      // Act
      render(<SiteHeader />);

      // Assert
      expect(screen.getByRole("banner", { name: "navLabel" })).toBeInTheDocument();
    });
  });

  describe("GIVEN the active route is a lesson page", () => {
    test("WHEN rendered THEN the eyebrow names the lesson section", () => {
      // Arrange
      mockUsePathname.mockReturnValue("/courses/c/modules/m/lessons/abc");

      // Act
      render(<SiteHeader />);

      // Assert
      expect(screen.getByText(/sectionLesson/)).toBeInTheDocument();
    });
  });

  describe("GIVEN the active route is the home page", () => {
    test("WHEN rendered THEN the eyebrow names the home section", () => {
      // Arrange
      mockUsePathname.mockReturnValue("/");

      // Act
      render(<SiteHeader />);

      // Assert
      expect(screen.getByText(/sectionHome/)).toBeInTheDocument();
    });
  });
});
