import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ProfileCardBand } from "./profile-card-band";

// Testing Library renders, it never hydrates, so the real hook would always
// report a hydrated page and the zero state could not be reached.
vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({ useIsHydrated: vi.fn() }));

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 4,
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

const lessonRuntimes = [0, 1, 2, 3].map((index) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId: vowels.id,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: index + 1,
}));

const levels: AchievementLevel[] = [{ course, modules: [vowels], lessonRuntimes }];

const level = { number: 1, courseTitle: course.title };

const renderBand = (locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <ProfileCardBand
      name="Ana García"
      avatar={{ kind: "initials" }}
      level={level}
      lessonRuntimes={lessonRuntimes}
      levels={levels}
    />,
    locale,
  );

/** Two of the four lessons watched, with their tickets and the module's prize. */
const givenHalfTheCourseWatched = () => {
  const watched = [lessonRuntimes[0]!.id, lessonRuntimes[1]!.id];
  givenLearner.completed(watched);
  givenLearner.earnedTickets(watched);
  givenLearner.claimedPrizes([vowels.slug]);
};

/** The panel beside the card — the card prints the same tally in its footer. */
const panel = () => within(screen.getByTestId("profile-progress"));

const stat = (testId: string) => within(screen.getByTestId(testId));

beforeEach(() => {
  vi.mocked(useIsHydrated).mockReturnValue(true);
  givenLearner.notCompleted(lessonRuntimes.map((lesson) => lesson.id));
  givenLearner.withoutEarnedTickets(lessonRuntimes.map((lesson) => lesson.id));
  givenLearner.withoutClaimedPrizes([vowels.slug]);
});

describe("ProfileCardBand", () => {
  describe("GIVEN a learner part-way through the level", () => {
    test("WHEN the band renders THEN it names the progress, the tickets and the prizes", async () => {
      givenHalfTheCourseWatched();

      renderBand();

      expect(screen.getByTestId("learner-card")).toBeInTheDocument();
      await waitFor(() => expect(panel().getByText("2 of 4 videos")).toBeInTheDocument());
      expect(panel().getByText("50%")).toBeInTheDocument();
      expect(panel().getByText("Your progress in Basic Course")).toBeInTheDocument();
      expect(stat("tickets-earned").getByText("2")).toBeInTheDocument();
      expect(stat("prizes-claimed").getByText("1")).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner who has watched nothing", () => {
    test("WHEN the band renders THEN every figure is zero", async () => {
      renderBand();

      await waitFor(() => expect(panel().getByText("0 of 4 videos")).toBeInTheDocument());
      expect(panel().getByText("0%")).toBeInTheDocument();
      expect(stat("tickets-earned").getByText("0")).toBeInTheDocument();
      expect(stat("prizes-claimed").getByText("0")).toBeInTheDocument();
    });
  });

  describe("GIVEN a page that has not hydrated yet", () => {
    test("WHEN the band renders THEN it shows zero rather than a figure it would correct", () => {
      vi.mocked(useIsHydrated).mockReturnValue(false);
      givenHalfTheCourseWatched();

      renderBand();

      expect(panel().getByText("0 of 4 videos")).toBeInTheDocument();
      expect(panel().getByText("0%")).toBeInTheDocument();
      expect(stat("tickets-earned").getByText("0")).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner reading in Portuguese", () => {
    test("WHEN the band renders THEN its labels come from pt.json", async () => {
      givenHalfTheCourseWatched();

      renderBand("pt");

      await waitFor(() => expect(panel().getByText("2 de 4 vídeos")).toBeInTheDocument());
      expect(panel().getByText("Seu progresso em Basic Course")).toBeInTheDocument();
      expect(panel().getByText("Tickets ganhos")).toBeInTheDocument();
      expect(panel().getByText("Prêmios resgatados")).toBeInTheDocument();
    });
  });
});
