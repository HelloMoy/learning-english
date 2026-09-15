import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useCanInstallToHomeScreen } from "@/hooks/use-can-install-to-home-screen/use-can-install-to-home-screen";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { usePathname } from "@/i18n/navigation";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
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
vi.mock("@/hooks/use-can-install-to-home-screen/use-can-install-to-home-screen", () => ({
  useCanInstallToHomeScreen: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("@/hooks/use-learner-profile/use-learner-profile", () => ({
  useLearnerProfile: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
  // Props are spread so a menu item rendered `asChild` keeps its role on the anchor.
  Link: ({
    children,
    href,
    ...rest
  }: { children: React.ReactNode; href: string } & React.ComponentProps<"a">) => (
    <a
      href={href}
      {...rest}
    >
      {children}
    </a>
  ),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUsePathname = vi.mocked(usePathname);
const mockUseLearnerProfile = vi.mocked(useLearnerProfile);

const withoutProfile = { status: "absent", save: vi.fn() } as const;

beforeEach(() => {
  mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  mockUseLearnerProfile.mockReturnValue(withoutProfile);
});

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

describe("SiteHeader install control", () => {
  describe("GIVEN the flow only exists on an uninstalled iPhone Safari", () => {
    test("WHEN the app can be installed THEN the control is offered", () => {
      vi.mocked(useCanInstallToHomeScreen).mockReturnValue(true);

      render(<SiteHeader />);

      expect(screen.getByRole("button", { name: "openGuide" })).toBeInTheDocument();
    });

    test("WHEN it cannot THEN no control is offered", () => {
      // Desktop, another iOS browser, or an app already launched from the home
      // screen — in all three the guide would be noise.
      vi.mocked(useCanInstallToHomeScreen).mockReturnValue(false);

      render(<SiteHeader />);

      expect(screen.queryByRole("button", { name: "openGuide" })).not.toBeInTheDocument();
    });
  });
});

describe("sectionKey for the learner's own routes", () => {
  test.each([
    ["/start", "sectionStart"],
    ["/start/avatar", "sectionStart"],
    ["/learning", "sectionLearning"],
    ["/profile", "sectionProfile"],
  ])("derives %s → %s", (path, expected) => {
    expect(sectionKey(path)).toBe(expected);
  });
});

describe("SiteHeader learner menu", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  test("GIVEN no learner profile WHEN rendered THEN no avatar trigger is offered", () => {
    render(<SiteHeader />);

    expect(screen.queryByRole("button", { name: "learnerMenuLabel" })).not.toBeInTheDocument();
  });

  test("GIVEN the profile is not known yet WHEN rendered THEN no avatar trigger is offered", () => {
    mockUseLearnerProfile.mockReturnValue({ status: "unknown", save: vi.fn() });

    render(<SiteHeader />);

    expect(screen.queryByRole("button", { name: "learnerMenuLabel" })).not.toBeInTheDocument();
  });

  test("GIVEN a learner profile WHEN the avatar is opened THEN it offers My learning and Profile", async () => {
    const user = userEvent.setup();
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });

    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));

    expect(await screen.findByRole("menuitem", { name: "myLearning" })).toHaveAttribute(
      "href",
      "/learning",
    );
    expect(screen.getByRole("menuitem", { name: "profile" })).toHaveAttribute("href", "/profile");
  });

  describe("GIVEN a phone-width header with a learner profile", () => {
    const setTheme = vi.fn();

    beforeEach(() => {
      setTheme.mockClear();
      vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme } as never);
      mockUseLearnerProfile.mockReturnValue({
        status: "present",
        profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
        save: vi.fn(),
      });
    });

    test("WHEN rendered THEN the row's theme toggle is hidden below sm", () => {
      render(<SiteHeader />);

      expect(screen.getByTestId("header-theme-toggle")).toHaveClass("hidden", "sm:inline-flex");
    });

    test("WHEN the avatar menu is opened THEN a phone-only theme item toggles the theme", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);

      await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));
      const themeItem = await screen.findByRole("menuitem", { name: "label: light" });
      expect(themeItem).toHaveClass("sm:hidden");
      await user.click(themeItem);

      await waitFor(() => expect(setTheme).toHaveBeenCalledWith("dark"));
    });

    test("WHEN the theme item is chosen THEN the menu stays open so the switch's slide is seen", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);

      await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));
      await user.click(await screen.findByRole("menuitem", { name: "label: light" }));

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "label: dark" })).toBeInTheDocument();
    });

    test("WHEN the theme item switches THEN both theme names stay laid out so the menu keeps its width", async () => {
      // jsdom has no layout, so the guard is structural: the item always
      // renders both names in one cell and only hides the inactive one, which
      // is what pins its width to the longer name.
      const user = userEvent.setup();
      render(<SiteHeader />);

      await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));
      const themeItem = await screen.findByRole("menuitem", { name: "label: light" });
      const nameOf = (theme: string) => within(themeItem).getByText(theme);

      expect(nameOf("light")).not.toHaveClass("invisible");
      expect(nameOf("dark")).toHaveClass("invisible");

      await user.click(themeItem);

      expect(nameOf("dark")).not.toHaveClass("invisible");
      expect(nameOf("light")).toHaveClass("invisible");
    });
  });

  test("GIVEN no learner profile WHEN rendered THEN the row's theme toggle shows at every width", () => {
    render(<SiteHeader />);

    expect(screen.getByTestId("header-theme-toggle")).not.toHaveClass("hidden");
  });
});

describe("SiteHeader control order", () => {
  test("GIVEN the install control is present WHEN rendered THEN it leads the chips", () => {
    vi.mocked(useCanInstallToHomeScreen).mockReturnValue(true);

    render(<SiteHeader />);

    const labels = screen.getAllByRole("button").map((c) => c.getAttribute("aria-label"));

    expect(labels.indexOf("openGuide")).toBe(0);
  });
});
