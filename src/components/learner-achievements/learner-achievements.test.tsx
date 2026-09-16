import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  CourseAchievements,
  LearnerAchievements as LearnerAchievementsValue,
  ModuleAchievements,
  PrizeState,
} from "@/lib/learner-achievements/learner-achievements";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { LearnerAchievements } from "./learner-achievements";

const aCourse = (title: string, sequence: number): Course =>
  Course.parse({
    id: CourseId.parse(faker.string.uuid()),
    slug: `course-${sequence}`,
    title,
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: 0,
    moduleCount: 0,
    sequence,
  });

/** How many tickets a module in each state has collected. */
const ticketsFor = (state: PrizeState, ticketCount: number): number => {
  if (state === "claimed" || state === "ready") return ticketCount;
  return state === "collecting" ? 1 : 0;
};

const aModuleWith = (
  course: Course,
  title: string,
  prizeState: PrizeState,
  ticketCount = 2,
  slug = faker.helpers.slugify(title).toLowerCase(),
): ModuleAchievements => {
  const ticketsEarned = ticketsFor(prizeState, ticketCount);
  return {
    module: Module.parse({
      id: ModuleId.parse(faker.string.uuid()),
      courseId: course.id,
      slug,
      title,
      sequence: 1,
    }),
    prize: "gift",
    prizeState,
    ticketsEarned,
    tickets: Array.from({ length: ticketCount }, (_, index) => ({
      lessonId: LessonId.parse(faker.string.uuid()),
      title: faker.lorem.words(3),
      symbol: String(index + 1),
      isEarned: index < ticketsEarned,
    })),
  };
};

const achievementsOf = (
  courses: CourseAchievements[],
  totals: Pick<
    LearnerAchievementsValue,
    "ticketsEarned" | "ticketCount" | "prizesRedeemed" | "prizeCount"
  >,
): LearnerAchievementsValue => ({ courses, ...totals, distinction: "student" });

describe("LearnerAchievements", () => {
  test("WHEN a prize is claimed on a shelf THEN the page is told which module it was", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    const basic = aCourse("Basic Course", 1);
    const readyToClaim = achievementsOf(
      [{ course: basic, modules: [aModuleWith(basic, "Vowels", "ready", 17, "2-vowels")] }],
      { ticketsEarned: 17, ticketCount: 17, prizesRedeemed: 0, prizeCount: 1 },
    );

    renderInLocale(
      <LearnerAchievements
        achievements={readyToClaim}
        onClaim={onClaim}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Claim the Vowels prize" }));

    expect(onClaim).toHaveBeenCalledExactlyOnceWith("2-vowels");
  });

  test("WHEN a prize is the one the learner came for THEN the counter points at it", () => {
    const basic = aCourse("Basic Course", 1);
    const readyToClaim = achievementsOf(
      [{ course: basic, modules: [aModuleWith(basic, "Vowels", "ready", 17, "2-vowels")] }],
      { ticketsEarned: 17, ticketCount: 17, prizesRedeemed: 0, prizeCount: 1 },
    );

    const { container } = renderInLocale(
      <LearnerAchievements
        achievements={readyToClaim}
        calledModuleSlug="2-vowels"
      />,
    );

    expect(container.querySelector('[data-called="true"]')).toHaveAttribute(
      "data-prize-slug",
      "2-vowels",
    );
  });

  test("WHEN rendered THEN it counts tickets and prizes across the whole catalog", () => {
    const basic = aCourse("Basic Course", 1);
    const achievements = achievementsOf(
      [{ course: basic, modules: [aModuleWith(basic, "Introduction", "claimed")] }],
      { ticketsEarned: 13, ticketCount: 155, prizesRedeemed: 1, prizeCount: 15 },
    );

    renderInLocale(<LearnerAchievements achievements={achievements} />);

    expect(
      within(screen.getByTestId("achievements-ticket-count")).getByText("13 of 155 tickets"),
    ).toHaveClass("sr-only");
    expect(
      within(screen.getByTestId("achievements-prize-count")).getByText("1 of 15 prizes"),
    ).toHaveClass("sr-only");
  });

  test("WHEN the counts animate THEN their moving digits are hidden from assistive technology", () => {
    const basic = aCourse("Basic Course", 1);
    const achievements = achievementsOf(
      [{ course: basic, modules: [aModuleWith(basic, "Introduction", "claimed")] }],
      { ticketsEarned: 13, ticketCount: 155, prizesRedeemed: 1, prizeCount: 15 },
    );

    renderInLocale(<LearnerAchievements achievements={achievements} />);

    for (const count of [
      screen.getByTestId("achievements-ticket-count"),
      screen.getByTestId("achievements-prize-count"),
    ]) {
      expect(count.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(count).toHaveClass("achievement-rise");
    }
  });

  test("WHEN the catalog holds two courses THEN the prize counter shows a shelf for each", () => {
    const basic = aCourse("Basic Course", 1);
    const advanced = aCourse("Advanced Intermediate Course", 2);
    const achievements = achievementsOf(
      [
        { course: basic, modules: [aModuleWith(basic, "Vowels", "collecting")] },
        { course: advanced, modules: [aModuleWith(advanced, "Intonation", "locked")] },
      ],
      { ticketsEarned: 1, ticketCount: 4, prizesRedeemed: 0, prizeCount: 2 },
    );

    renderInLocale(<LearnerAchievements achievements={achievements} />);

    expect(screen.getByRole("region", { name: "Basic Course" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Advanced Intermediate Course" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("WHEN one ticket is earned in es THEN the count uses the singular", () => {
    const basic = aCourse("Basic Course", 1);
    const achievements = achievementsOf(
      [{ course: basic, modules: [aModuleWith(basic, "Introduction", "collecting")] }],
      { ticketsEarned: 1, ticketCount: 1, prizesRedeemed: 0, prizeCount: 1 },
    );

    renderInLocale(<LearnerAchievements achievements={achievements} />, "es");

    expect(
      within(screen.getByTestId("achievements-ticket-count")).getByText("1 de 1 ticket"),
    ).toHaveClass("sr-only");
  });
});
