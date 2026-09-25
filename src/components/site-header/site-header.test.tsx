import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useInstallPath } from "@/hooks/use-install-path/use-install-path";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { sectionKey, SiteHeader } from "./site-header";

/**
 * Mock the next-intl and navigation hooks directly rather than standing up
 * real providers — the routing-to-section mapping is what these tests are
 * about. Returning the key as the label keeps assertions decoupled from
 * translated copy.
 *
 * The header composes `LocaleSwitcher`, so its hooks (`useLocale`,
 * `useRouter`) have to be stubbed too. Rendering the real children rather
 * than stubbing the components keeps the test honest about what the header
 * actually mounts.
 */
vi.mock("@/hooks/use-install-path/use-install-path", () => ({
  useInstallPath: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
  useFormatter: vi.fn(() => ({ number: (value: number) => String(value) })),
}));

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { signOut: vi.fn(async () => ({ data: { success: true }, error: null })) },
}));

vi.mock("@/hooks/use-learner-profile/use-learner-profile", () => ({
  useLearnerProfile: vi.fn(),
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
  // The common case: a browser with no way to install. Tests about the chip
  // say so for themselves.
  vi.mocked(useInstallPath).mockReturnValue({ kind: "none" });
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

  describe("GIVEN any route", () => {
    test("WHEN rendered THEN the eyebrow is the section alone, with no tagline", () => {
      // Arrange
      mockUsePathname.mockReturnValue("/profile");

      // Act
      render(<SiteHeader />);

      // Assert
      expect(screen.getByText("sectionProfile")).toHaveTextContent(/^sectionProfile$/);
      expect(screen.queryByText(/tagline/)).not.toBeInTheDocument();
    });
  });
});

describe("SiteHeader install control", () => {
  describe("GIVEN a browser that can only be taught the flow", () => {
    test("WHEN the flow exists THEN the control offers the guide", () => {
      vi.mocked(useInstallPath).mockReturnValue({ kind: "guide" });

      render(<SiteHeader />);

      expect(screen.getByRole("button", { name: "openGuide" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a Safari whose taps are not the iPhone's", () => {
    test.each([
      ["an iPad", "ipad-guide", "openGuideIpad"],
      ["a Mac", "mac-guide", "openGuideMac"],
    ] as const)("WHEN it is %s THEN the control names that platform's guide", (_n, kind, name) => {
      vi.mocked(useInstallPath).mockReturnValue({ kind });

      render(<SiteHeader />);

      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });

  describe("GIVEN a browser that offered to do the install itself", () => {
    test("WHEN the offer stands THEN the control offers the prompt", () => {
      vi.mocked(useInstallPath).mockReturnValue({ kind: "prompt", accept: vi.fn() });

      render(<SiteHeader />);

      expect(screen.getByRole("button", { name: "openPrompt" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a browser with no way in", () => {
    test("WHEN there is no path THEN no control is offered", () => {
      // Firefox, desktop Safari, or an app already launched from the home
      // screen — in all of them the control would lead nowhere.
      vi.mocked(useInstallPath).mockReturnValue({ kind: "none" });

      render(<SiteHeader />);

      const chips = screen.queryAllByRole("button", {
        name: /openGuide|openGuideIpad|openGuideMac|openPrompt/,
      });

      expect(chips).toEqual([]);
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
    render(<SiteHeader signedIn />);

    expect(screen.queryByRole("button", { name: "learnerMenuLabel" })).not.toBeInTheDocument();
  });

  test("GIVEN the profile is not known yet WHEN rendered THEN no avatar trigger is offered", () => {
    mockUseLearnerProfile.mockReturnValue({ status: "unknown", save: vi.fn() });

    render(<SiteHeader signedIn />);

    expect(screen.queryByRole("button", { name: "learnerMenuLabel" })).not.toBeInTheDocument();
  });

  test("GIVEN a session whose card is not known yet WHEN rendered THEN the avatar's place is held", () => {
    // Showing Sign out for the moment before the card arrives widens the row
    // past a 320px phone, then snaps back.
    mockUseLearnerProfile.mockReturnValue({ status: "unknown", save: vi.fn() });

    render(<SiteHeader signedIn />);

    expect(screen.queryByRole("button", { name: "signOut" })).not.toBeInTheDocument();
    expect(screen.getByTestId("learner-menu-placeholder")).toBeInTheDocument();
  });

  test("GIVEN a learner profile WHEN the avatar is opened THEN it offers My learning, Achievements and Profile in order", async () => {
    const user = userEvent.setup();
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });

    render(<SiteHeader signedIn />);
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

  describe("GIVEN the theme is changed only from the Profile page", () => {
    beforeEach(() => {
      mockUseLearnerProfile.mockReturnValue({
        status: "present",
        profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
        save: vi.fn(),
      });
    });

    test("WHEN rendered with a learner profile THEN the header offers no theme control", () => {
      render(<SiteHeader signedIn />);

      expect(screen.queryByTestId("header-theme-toggle")).not.toBeInTheDocument();
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });

    test("WHEN the avatar menu is opened THEN it offers no theme item", async () => {
      const user = userEvent.setup();
      render(<SiteHeader signedIn />);

      await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));
      await screen.findByRole("menu");

      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).toEqual(["myLearning", "achievements", "profile", "signOut"]);
    });
  });

  test("GIVEN no learner profile WHEN rendered THEN the header offers no theme control either", () => {
    render(<SiteHeader signedIn />);

    expect(screen.queryByTestId("header-theme-toggle")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
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
      givenLearner.earnedTickets([lesson.id]);
    }
  };

  beforeEach(() => {
    window.localStorage.clear();
    mockUsePathname.mockReturnValue("/");
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });
  });

  test("GIVEN a prize is ready to claim WHEN rendered THEN the avatar is marked with how many", () => {
    earnEveryTicket();

    render(
      <SiteHeader
        signedIn
        levels={levels}
      />,
    );

    expect(screen.getByTestId("prize-mark")).toHaveTextContent("1");
  });

  test("GIVEN a prize is ready to claim WHEN rendered THEN the menu says so in a sentence", () => {
    // The mark itself is decoration; the trigger's name is what is heard.
    earnEveryTicket();

    render(
      <SiteHeader
        signedIn
        levels={levels}
      />,
    );

    expect(screen.getByRole("button", { name: "learnerMenuLabelWithPrizes" })).toBeInTheDocument();
  });

  test("GIVEN no prize is ready WHEN rendered THEN nothing is marked", () => {
    render(
      <SiteHeader
        signedIn
        levels={levels}
      />,
    );

    expect(screen.queryByTestId("prize-mark")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "learnerMenuLabel" })).toBeInTheDocument();
  });

  test("GIVEN the prize has been claimed WHEN rendered THEN the mark is gone", () => {
    earnEveryTicket();
    givenLearner.claimedPrizes([vowels.slug]);

    render(
      <SiteHeader
        signedIn
        levels={levels}
      />,
    );

    expect(screen.queryByTestId("prize-mark")).not.toBeInTheDocument();
  });

  test("GIVEN a prize is ready to claim WHEN the menu is opened THEN the Achievements item is marked too", async () => {
    const user = userEvent.setup();
    earnEveryTicket();

    render(
      <SiteHeader
        signedIn
        levels={levels}
      />,
    );
    await user.click(screen.getByRole("button", { name: "learnerMenuLabelWithPrizes" }));

    const achievements = await screen.findByRole("menuitem", { name: /achievements/ });
    expect(within(achievements).getByTestId("prize-mark-item")).toHaveTextContent("1");
  });

  test("GIVEN no learner card WHEN a prize would be ready THEN there is no avatar to mark", () => {
    // Without a card there is no menu at all, so nothing carries the mark.
    earnEveryTicket();
    mockUseLearnerProfile.mockReturnValue(withoutProfile);

    render(
      <SiteHeader
        signedIn
        levels={levels}
      />,
    );

    expect(screen.queryByTestId("prize-mark")).not.toBeInTheDocument();
  });
});

describe("SiteHeader control order", () => {
  test("GIVEN the install control is present WHEN rendered THEN it leads the chips", () => {
    vi.mocked(useInstallPath).mockReturnValue({ kind: "guide" });

    render(<SiteHeader />);

    const labels = screen.getAllByRole("button").map((c) => c.getAttribute("aria-label"));

    expect(labels.indexOf("openGuide")).toBe(0);
  });
});

describe("SiteHeader session", () => {
  const withProfile = {
    status: "present",
    profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
    save: vi.fn(),
  } as const;

  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  test("GIVEN no session WHEN rendered THEN it offers Sign in and no avatar, even if this device knows a card", () => {
    mockUseLearnerProfile.mockReturnValue(withProfile);

    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "signIn" })).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByRole("button", { name: "learnerMenuLabel" })).not.toBeInTheDocument();
  });

  test("GIVEN a session WHEN rendered THEN Sign in is not offered", () => {
    mockUseLearnerProfile.mockReturnValue(withProfile);

    render(<SiteHeader signedIn />);

    expect(screen.queryByRole("link", { name: "signIn" })).not.toBeInTheDocument();
  });

  test("GIVEN a session and a card WHEN Sign out is chosen from the avatar menu THEN the session ends and the home opens fresh", async () => {
    const router = { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() };
    vi.mocked(useRouter).mockReturnValue(router as never);
    mockUseLearnerProfile.mockReturnValue(withProfile);
    const user = userEvent.setup();

    render(<SiteHeader signedIn />);
    await user.click(screen.getByRole("button", { name: "learnerMenuLabel" }));
    await user.click(await screen.findByRole("menuitem", { name: "signOut" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(authClient.signOut).toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalled();
  });

  test("GIVEN a session but no card yet WHEN rendered THEN signing out is still offered", () => {
    render(<SiteHeader signedIn />);

    expect(screen.getByRole("button", { name: "signOut" })).toBeInTheDocument();
  });
});

describe("SiteHeader account control on a phone", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  test("GIVEN no session WHEN rendered THEN the text link gives way to an account trigger below sm", () => {
    // The word is what the wordmark cannot afford to share the row with, so
    // below `sm` the action moves behind the same round trigger the avatar uses.
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "signIn" })).toHaveClass("hidden", "sm:inline-flex");
    expect(screen.getByRole("button", { name: "accountMenuLabel" })).toHaveClass("sm:hidden");
  });

  test("GIVEN no session WHEN rendered THEN the account trigger wears the header's chip, not the avatar's round frame", () => {
    // It stands in a row of chips, not in place of a portrait: the avatar is
    // round because it holds a face, and this one holds a glyph.
    render(<SiteHeader />);

    expect(screen.getByRole("button", { name: "accountMenuLabel" })).toHaveClass(
      "rounded-md",
      "border",
      "border-border",
      "bg-foreground/5",
    );
  });

  test("GIVEN no session WHEN the account trigger is opened THEN its menu offers Sign in", async () => {
    const user = userEvent.setup();

    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "accountMenuLabel" }));

    expect(await screen.findByRole("menuitem", { name: "signIn" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  test("GIVEN no session WHEN the account trigger is opened THEN its menu offers Sign in, then Create account", async () => {
    const user = userEvent.setup();

    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "accountMenuLabel" }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["signIn", "signUp"]);
    expect(screen.getByRole("menuitem", { name: "signUp" })).toHaveAttribute("href", "/sign-up");
  });

  test("GIVEN a session whose device has no card WHEN the account trigger is opened THEN its menu offers Sign out alone", async () => {
    const user = userEvent.setup();

    render(<SiteHeader signedIn />);
    await user.click(screen.getByRole("button", { name: "accountMenuLabel" }));

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["signOut"]);
  });

  test("GIVEN a session whose device has no card WHEN rendered THEN the Sign out button is the desktop half", () => {
    render(<SiteHeader signedIn />);

    expect(screen.getByRole("button", { name: "signOut" })).toHaveClass("hidden", "sm:inline-flex");
  });

  test("GIVEN a learner card WHEN rendered THEN the avatar menu is the account control, with no second trigger", () => {
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });

    render(<SiteHeader signedIn />);

    expect(screen.queryByRole("button", { name: "accountMenuLabel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "learnerMenuLabel" })).toBeInTheDocument();
  });
});

describe("SiteHeader wordmark destination", () => {
  const wordmark = () => screen.getByRole("link", { name: /english.*course/i });

  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  test("GIVEN no session WHEN rendered THEN the wordmark links to the locale home", () => {
    render(<SiteHeader />);

    expect(wordmark()).toHaveAttribute("href", "/");
  });

  test("GIVEN a session WHEN rendered THEN the wordmark links to My learning", () => {
    mockUseLearnerProfile.mockReturnValue({
      status: "present",
      profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
      save: vi.fn(),
    });

    render(<SiteHeader signedIn />);

    expect(wordmark()).toHaveAttribute("href", "/learning");
  });

  test("GIVEN a session but no card WHEN rendered THEN the wordmark still links to My learning", () => {
    // The destination follows the session, which the server decided, not the
    // card, which this device may never have been given.
    render(<SiteHeader signedIn />);

    expect(wordmark()).toHaveAttribute("href", "/learning");
  });
});
