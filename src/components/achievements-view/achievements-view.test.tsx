import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { refreshEarnedTickets } from "@/hooks/use-earned-tickets/use-earned-tickets";
import { refreshCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { refreshPrizeClaims } from "@/hooks/use-prize-claims/use-prize-claims";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { useRouter } from "@/i18n/navigation";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { act, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AchievementsView } from "./achievements-view";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
  sequence: 1,
});

const vowels = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 1,
});

const lessonRuntimes = [0, 1].map((index) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId: vowels.id,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: index + 1,
}));

const levels: AchievementLevel[] = [{ course, modules: [vowels], lessonRuntimes }];

const level = { number: 1, courseTitle: "Basic Course" };

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });

const router = { replace: vi.fn(), push: vi.fn() };

const announceStorageChange = () => {
  act(() => {
    // Every store caches its snapshot, and tickets and claims outlive a lesson's
    // completion — so clearing storage has to reach all four, or one test's
    // rewards leak into the next.
    refreshCompletedLessons();
    refreshSavedPlaybackPositions();
    refreshEarnedTickets();
    refreshPrizeClaims();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

const markComplete = (...lessons: ReadonlyArray<{ id: LessonId }>) => {
  for (const lesson of lessons) {
    window.localStorage.setItem(`learning-english:completed:${lesson.id}`, "1");
  }
  announceStorageChange();
};

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

const continuedLesson = lessonRuntimes[1]!;

const location = ContinueWatchingLocation.parse({
  courseSlug: course.slug,
  moduleSlug: vowels.slug,
  lessonId: continuedLesson.id,
});

const panel: ContinueWatchingPanel = {
  courseSlug: course.slug,
  courseTitle: course.title,
  moduleId: vowels.id,
  moduleSequence: vowels.sequence,
  moduleTitle: vowels.title,
  lessonSequence: 2,
  lessonTitle: "The Vowel Sound Schwa",
  lessonHref: `/courses/basic-course/modules/2-vowels/lessons/${continuedLesson.id}`,
  durationSeconds: 300,
};

const firstLesson = {
  href: `/courses/basic-course/modules/2-vowels/lessons/${lessonRuntimes[0]!.id}`,
  minutes: 5,
  courseTitle: "Basic Course",
};

const storing = (stored: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => stored,
  set: async () => {},
});

/** A record whose round-trip never answers, so the reserved state can be seen. */
const neverAnswers = () => new Promise<ContinueWatchingPanel | null>(() => {});

const renderAchievements = (
  profiles = makeStubLearnerProfileRepository({ profile }),
  locale?: "en" | "es" | "pt",
  searchParams = "",
  watching: {
    continueWatching?: ContinueWatchingRepository;
    resolve?: () => Promise<ContinueWatchingPanel | null>;
  } = {},
) =>
  renderInLocale(
    <NuqsTestingAdapter searchParams={searchParams}>
      <NiceModal.Provider>
        <AchievementsView
          profiles={profiles}
          level={level}
          lessonRuntimes={lessonRuntimes}
          levels={levels}
          firstLesson={firstLesson}
          // Nothing stored by default: no test reaches the real Server Action.
          continueWatching={watching.continueWatching ?? storing(null)}
          resolve={watching.resolve}
        />
      </NiceModal.Provider>
    </NuqsTestingAdapter>,
    locale,
  );

describe("AchievementsView", () => {
  test("WHEN storage has not answered THEN a shell stands in and no count is asserted", () => {
    renderAchievements();

    expect(screen.getByTestId("achievements-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("achievements-ticket-count")).not.toBeInTheDocument();
  });

  test("WHEN the device has no profile THEN the learner is sent to the onboarding", async () => {
    renderAchievements(makeStubLearnerProfileRepository());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
  });

  describe("GIVEN a learner with a card", () => {
    test("WHEN the page opens THEN it shows the card, the counts and how they work, not the card editor", async () => {
      renderAchievements();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Your achievements" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("learner-card")).toHaveAttribute("data-distinction", "student");
      expect(screen.getByText("0 of 2 tickets", { selector: ".sr-only" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "How do they work?" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Edit card" })).not.toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    });

    test("WHEN How do they work? is activated THEN the explanation opens AND closing it returns focus", async () => {
      const user = userEvent.setup();
      renderAchievements();

      const howItWorks = await screen.findByRole("button", { name: "How do they work?" });
      await user.click(howItWorks);
      expect(
        await screen.findByRole("dialog", { name: "How do tickets and prizes work?" }),
      ).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(howItWorks).toHaveFocus();
    });

    test("WHEN the page opens THEN the card and then the heading block rise into place", async () => {
      renderAchievements();

      const heading = await screen.findByRole("heading", { level: 1, name: "Your achievements" });
      const cardBlock = screen.getByTestId("learner-card").parentElement!;
      const headingBlock = heading.closest(".achievement-rise") as HTMLElement | null;

      expect(cardBlock).toHaveClass("achievement-rise");
      expect(headingBlock).not.toBeNull();
      expect(cardBlock.style.getPropertyValue("--motion-order")).toBe("0");
      expect(headingBlock!.style.getPropertyValue("--motion-order")).toBe("1");
    });

    test("WHEN a lesson is complete THEN its ticket is counted AND the card holds its progress", async () => {
      markComplete(lessonRuntimes[0]!);

      renderAchievements();

      expect(
        await screen.findByText("1 of 2 tickets", { selector: ".sr-only" }),
      ).toBeInTheDocument();
      expect(screen.getByText("1 of 2 videos")).toBeInTheDocument();
    });

    test("WHEN every lesson is complete THEN the card takes the gold finish", async () => {
      markComplete(...lessonRuntimes);

      renderAchievements();

      await waitFor(() =>
        expect(screen.getByTestId("learner-card")).toHaveAttribute("data-distinction", "gold"),
      );
    });

    test("WHEN a module holds every ticket THEN claiming its prize reveals it AND keeps it claimed", async () => {
      const user = userEvent.setup();
      markComplete(...lessonRuntimes);
      renderAchievements();

      const claim = await screen.findByRole("button", { name: "Claim the Vowels prize" });
      await user.click(claim);

      // The claim is recorded before the reveal plays, so closing early keeps it.
      expect(
        window.localStorage.getItem(`learning-english:prize-claimed:${vowels.slug}`),
      ).not.toBeNull();
      expect(await screen.findByRole("dialog", { name: "Harmonica" })).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(
        screen.queryByRole("button", { name: "Claim the Vowels prize" }),
      ).not.toBeInTheDocument();
      expect(await screen.findByText("1 of 1 prize", { selector: ".sr-only" })).toBeInTheDocument();
    });

    describe("GIVEN they arrived from the dialog that sent them to claim a prize", () => {
      test("WHEN the page opens THEN that prize is brought into view, focused and pointed out", async () => {
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;
        markComplete(...lessonRuntimes);

        renderAchievements(undefined, undefined, `?claim=${vowels.slug}`);

        const prize = await screen.findByRole("button", { name: "Claim the Vowels prize" });
        const item = prize.closest("[data-prize-slug]");
        await waitFor(() => expect(item).toHaveAttribute("data-called", "true"));
        expect(item).toHaveFocus();
        expect(scrollIntoView).toHaveBeenCalled();
      });

      test("WHEN the module has nothing to claim THEN nothing is pointed out", async () => {
        Element.prototype.scrollIntoView = vi.fn();

        renderAchievements(undefined, undefined, `?claim=${vowels.slug}`);

        await screen.findByRole("heading", { level: 1, name: "Your achievements" });
        expect(document.querySelector('[data-called="true"]')).toBeNull();
      });
    });

    describe("GIVEN the way back into the course", () => {
      test("WHEN the record resolves to a lesson THEN continuing the course opens that lesson", async () => {
        renderAchievements(undefined, undefined, "", {
          continueWatching: storing(location),
          resolve: async () => panel,
        });

        const action = await screen.findByRole("link", { name: "Continue the course" });
        expect(action).toHaveAttribute("href", panel.lessonHref);
      });

      test("WHEN the lesson's title is long THEN it never reaches the action", async () => {
        // The action names the course, so a title like "Rule 10: N + T + Vowel
        // becomes N" can no longer stretch the button that carries it.
        const longTitle = "Rule 10: N + T + Vowel becomes N, and other fast-speech reductions";
        renderAchievements(undefined, undefined, "", {
          continueWatching: storing(location),
          resolve: async () => ({ ...panel, lessonTitle: longTitle }),
        });

        const action = await screen.findByRole("link", { name: "Continue the course" });
        expect(action).toHaveAttribute("href", panel.lessonHref);
        expect(action).not.toHaveTextContent(longTitle);
      });

      test("WHEN nothing has been started THEN it offers to start the course", async () => {
        // "Continue" would be a lie told to someone who has started nothing.
        renderAchievements();

        const action = await screen.findByRole("link", { name: "Start the course" });
        expect(action).toHaveAttribute("href", firstLesson.href);
      });

      test("WHEN the record has not resolved yet THEN the action is reserved and offers no destination", async () => {
        // The label no longer varies, but the destination still does: offering
        // the fallback here would change the target under the finger of a
        // learner who aimed at their own lesson.
        renderAchievements(undefined, undefined, "", {
          continueWatching: storing(location),
          resolve: neverAnswers,
        });

        await screen.findByRole("heading", { level: 1, name: "Your achievements" });
        await waitFor(() =>
          expect(screen.getByTestId("continue-course-skeleton")).toBeInTheDocument(),
        );
        expect(screen.queryByRole("link", { name: "Continue the course" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Start the course" })).not.toBeInTheDocument();
      });

      test("WHEN a prize is claimed THEN the reveal offers that same way back", async () => {
        // One destination for the page and the dialog, resolved once.
        const user = userEvent.setup();
        markComplete(...lessonRuntimes);
        renderAchievements(undefined, undefined, "", {
          continueWatching: storing(location),
          resolve: async () => panel,
        });

        await user.click(await screen.findByRole("button", { name: "Claim the Vowels prize" }));

        const dialog = await screen.findByRole("dialog", { name: "Harmonica" });
        expect(within(dialog).getByRole("link", { name: "Continue the course" })).toHaveAttribute(
          "href",
          panel.lessonHref,
        );
      });

      test("WHEN rendered in es THEN the way back is Spanish", async () => {
        renderAchievements(undefined, "es", "", {
          continueWatching: storing(location),
          resolve: async () => panel,
        });

        expect(
          await screen.findByRole("link", { name: "Continuar con el curso" }),
        ).toBeInTheDocument();
      });

      test("WHEN the record no longer resolves THEN it offers the first lesson instead", async () => {
        renderAchievements(undefined, undefined, "", {
          continueWatching: storing(location),
          resolve: async () => null,
        });

        expect(await screen.findByRole("link", { name: "Start the course" })).toHaveAttribute(
          "href",
          firstLesson.href,
        );
      });
    });

    test("WHEN rendered in es THEN the heading and how they work are Spanish", async () => {
      renderAchievements(undefined, "es");

      expect(
        await screen.findByRole("heading", { level: 1, name: "Tus logros" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "¿Cómo funcionan?" })).toBeInTheDocument();
    });
  });
});
