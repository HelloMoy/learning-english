import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  CourseAchievements,
  ModuleAchievements,
  PrizeState,
} from "@/lib/learner-achievements/learner-achievements";
import type { PrizeId } from "@/lib/module-prizes/module-prizes";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { PrizeCounter } from "./prize-counter";

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

const aModule = (
  course: Course,
  title: string,
  prize: PrizeId,
  prizeState: PrizeState,
  ticketCount: number,
): ModuleAchievements => {
  const ticketsEarned = ticketsFor(prizeState, ticketCount);
  return {
    module: Module.parse({
      id: ModuleId.parse(faker.string.uuid()),
      courseId: course.id,
      slug: faker.helpers.slugify(title).toLowerCase(),
      title,
      sequence: 1,
    }),
    prize,
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

const basic = aCourse("Basic Course", 1);
const advanced = aCourse("Advanced Intermediate Course", 2);

const introduction = aModule(basic, "Introduction", "whistle", "claimed", 1);
const vowels = aModule(basic, "Vowels", "harmonica", "ready", 17);
const consonants = aModule(basic, "Consonants", "megaphone", "locked", 25);

const courses: CourseAchievements[] = [
  { course: basic, modules: [introduction, vowels, consonants] },
  { course: advanced, modules: [aModule(advanced, "Intonation", "yoyo", "locked", 6)] },
];

describe("PrizeCounter", () => {
  test("WHEN rendered THEN each course gets a shelf headed by its title, in catalog order", () => {
    renderInLocale(<PrizeCounter courses={courses} />);

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Basic Course", "Advanced Intermediate Course"]);
  });

  test("WHEN a shelf is read THEN its prizes follow module order with their states", () => {
    renderInLocale(<PrizeCounter courses={courses} />);

    const basicShelf = screen.getByRole("region", { name: "Basic Course" });
    expect(
      within(basicShelf)
        .getAllByRole("listitem")
        .map((item) => item.getAttribute("data-prize-state")),
    ).toEqual(["claimed", "ready", "locked"]);
    expect(within(basicShelf).getByText("Whistle: prize redeemed")).toBeInTheDocument();
  });

  test("WHEN a shelf is read THEN it says how many of its prizes are redeemed", () => {
    renderInLocale(<PrizeCounter courses={courses} />);

    expect(
      within(screen.getByRole("region", { name: "Basic Course" })).getByText("1 of 3 prizes"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Advanced Intermediate Course" })).getByText(
        "0 of 1 prize",
      ),
    ).toBeInTheDocument();
  });

  test("WHEN a prize ready to claim is claimed THEN the counter is told which module it was", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    renderInLocale(
      <PrizeCounter
        courses={courses}
        onClaim={onClaim}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Claim the Vowels prize" }));

    expect(onClaim).toHaveBeenCalledExactlyOnceWith(vowels.module.slug);
  });

  test("WHEN the learner came for one prize THEN only that one is pointed out", () => {
    renderInLocale(
      <PrizeCounter
        courses={courses}
        calledModuleSlug={vowels.module.slug}
      />,
    );

    const called = screen
      .getByRole("region", { name: "Basic Course" })
      .querySelectorAll('[data-called="true"]');
    expect(called).toHaveLength(1);
    expect(called[0]).toHaveAttribute("data-prize-slug", vowels.module.slug);
  });

  test("WHEN rendered THEN the shelves rise in sequence after the counts", () => {
    renderInLocale(<PrizeCounter courses={courses} />);

    const shelves = screen.getAllByRole("region");
    expect(shelves.map((shelf) => shelf.style.getPropertyValue("--motion-order"))).toEqual([
      "2",
      "3",
    ]);
    for (const shelf of shelves) expect(shelf).toHaveClass("achievement-rise");
  });
});
