import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCanInstallToHomeScreen } from "@/hooks/use-can-install-to-home-screen/use-can-install-to-home-screen";
import { refreshEarnedTickets } from "@/hooks/use-earned-tickets/use-earned-tickets";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { refreshPrizeClaims } from "@/hooks/use-prize-claims/use-prize-claims";
import { usePathname } from "@/i18n/navigation";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";

import { faker } from "@faker-js/faker";
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
  useFormatter: vi.fn(() => ({ number: (value: number) => String(value) })),
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
    ["/achievements", "sectionAchievements"],
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

  test("GIVEN a learner profile WHEN the avatar is opened THEN it offers My learning, Achievements and Profile in order", async () => {
    const user = userEvent.setup();
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });

    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));

    await screen.findByRole("menuitem", { name: "myLearning" });
    const links = screen
      .getAllByRole("menuitem")
      .filter((item) => item.hasAttribute("href"))
      .map((item) => [item.textContent, item.getAttribute("href")]);
    expect(links).toEqual([
      ["myLearning", "/learning"],
      ["achievements", "/achievements"],
      ["profile", "/profile"],
    ]);
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

describe("SiteHeader prize mark", () => {
  const courseId = CourseId.parse(faker.string.uuid());
  const vowels = Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId,
    slug: "2-vowels",
    title: "Vowels",
    sequence: 1,
  });
  const lessons: LessonProgressSlice[] = [0, 1].map((index) => ({
    id: LessonId.parse(faker.string.uuid()),
    moduleId: vowels.id,
    durationSeconds: 300,
    title: faker.lorem.words(3),
    sequence: index + 1,
  }));
  const levels: AchievementLevel[] = [
    {
      course: Course.parse({
        id: courseId,
        slug: "basic-course",
        title: "Basic Course",
        description: faker.lorem.sentence(),
        language: "en",
        lessonCount: lessons.length,
        moduleCount: 1,
        sequence: 1,
      }),
      modules: [vowels],
      lessonRuntimes: lessons,
    },
  ];

  /** Every ticket of the module earned, so its prize is ready to claim. */
  const earnEveryTicket = () => {
    for (const lesson of lessons) {
      window.localStorage.setItem(`learning-english:ticket-earned:${lesson.id}`, "1");
    }
    refreshEarnedTickets();
  };

  beforeEach(() => {
    window.localStorage.clear();
    refreshEarnedTickets();
    refreshPrizeClaims();
    mockUsePathname.mockReturnValue("/");
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });
  });

  test("GIVEN a prize is ready to claim WHEN rendered THEN the avatar is marked with how many", () => {
    earnEveryTicket();

    render(<SiteHeader levels={levels} />);

    expect(screen.getByTestId("prize-mark")).toHaveTextContent("1");
  });

  test("GIVEN a prize is ready to claim WHEN rendered THEN the menu says so in a sentence", () => {
    // The mark itself is decoration; the trigger's name is what is heard.
    earnEveryTicket();

    render(<SiteHeader levels={levels} />);

    expect(screen.getByRole("button", { name: "learnerMenuLabelWithPrizes" })).toBeInTheDocument();
  });

  test("GIVEN no prize is ready WHEN rendered THEN nothing is marked", () => {
    render(<SiteHeader levels={levels} />);

    expect(screen.queryByTestId("prize-mark")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "learnerMenuLabel" })).toBeInTheDocument();
  });

  test("GIVEN the prize has been claimed WHEN rendered THEN the mark is gone", () => {
    earnEveryTicket();
    window.localStorage.setItem(`learning-english:prize-claimed:${vowels.slug}`, "1");
    refreshPrizeClaims();

    render(<SiteHeader levels={levels} />);

    expect(screen.queryByTestId("prize-mark")).not.toBeInTheDocument();
  });

  test("GIVEN a prize is ready to claim WHEN the menu is opened THEN the Achievements item is marked too", async () => {
    const user = userEvent.setup();
    earnEveryTicket();

    render(<SiteHeader levels={levels} />);
    await user.click(screen.getByRole("button", { name: "learnerMenuLabelWithPrizes" }));

    const achievements = await screen.findByRole("menuitem", { name: /achievements/ });
    expect(within(achievements).getByTestId("prize-mark-item")).toHaveTextContent("1");
  });

  test("GIVEN no learner card WHEN a prize would be ready THEN there is no avatar to mark", () => {
    // Without a card there is no menu at all, so nothing carries the mark.
    earnEveryTicket();
    mockUseLearnerProfile.mockReturnValue(withoutProfile);

    render(<SiteHeader levels={levels} />);

    expect(screen.queryByTestId("prize-mark")).not.toBeInTheDocument();
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
