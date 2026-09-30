import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, asReference, lessonOf } from "@/test-setup/stubs/course-views";

import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CourseCinemaHero } from "./course-cinema-hero";

const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);

function modelOf(
  view: CourseForView,
  options: {
    recordAt?: [number, number];
    positions?: Map<string, number>;
    completed?: string[];
    enrolled?: boolean;
  } = {},
) {
  const records = options.recordAt
    ? [
        ContinueWatchingRecord.parse({
          location: {
            courseSlug: view.course.slug,
            moduleSlug: view.modules[options.recordAt[0]]!.slug,
            lessonId: lessonOf(view, ...options.recordAt).id,
          },
          watchedAt: 1_000,
        }),
      ]
    : [];
  const positions = options.positions ?? new Map<string, number>();
  const shelf = courseShelf({
    courses: [view],
    enrolledSlugs: new Set(options.enrolled === false ? [] : [view.course.slug]),
    records,
    completedIds: new Set(options.completed ?? []),
    positions,
  });
  const shelfCourse = shelf.featured ?? shelf.recommended!;
  return courseCardModel(shelfCourse, { positions, claimedPrizes: new Set(["module-1"]) });
}

describe("CourseCinemaHero", () => {
  describe("GIVEN the course the learner watched last, part-way into a video", () => {
    const target = lessonOf(advanced, 1, 0);
    const model = modelOf(advanced, { recordAt: [1, 0], positions: new Map([[target.id, 365]]) });

    test("WHEN it renders THEN it is marked last watched AND enrolled AND titled by the course", () => {
      renderInLocale(
        <CourseCinemaHero
          model={model}
          label="last-watched"
        />,
      );

      const hero = screen.getByTestId("course-cinema-hero");
      expect(within(hero).getByText("Last watched")).toBeInTheDocument();
      expect(within(hero).getByText("Enrolled")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: advanced.course.title }),
      ).toBeInTheDocument();
      expect(hero).toHaveTextContent("Level 2 · 2 modules · 4 videos");
    });

    test("WHEN it renders THEN the chip says where to resume AND Continue course opens that video", () => {
      renderInLocale(
        <CourseCinemaHero
          model={model}
          label="last-watched"
        />,
      );

      expect(screen.getByText("Resume at 06:05")).toBeInTheDocument();
      expect(screen.getByText(target.title)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Continue course/ })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-2/lessons/${target.id}`,
      );
      expect(screen.getByRole("link", { name: /View course/ })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course",
      );
    });

    test("WHEN it renders THEN it counts the course's progress AND its prizes", () => {
      renderInLocale(
        <CourseCinemaHero
          model={model}
          label="last-watched"
        />,
      );

      const hero = screen.getByTestId("course-cinema-hero");
      expect(hero).toHaveTextContent("0 of 4 videos");
      expect(hero).toHaveTextContent("1 of 2 prizes");
    });
  });

  describe("GIVEN an enrolled course never opened", () => {
    test("WHEN it renders THEN it reads your course, next up AND Start course", () => {
      renderInLocale(
        <CourseCinemaHero
          model={modelOf(advanced)}
          label="your-course"
        />,
      );

      expect(screen.getByText("Your course")).toBeInTheDocument();
      expect(screen.getByText("Next up")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Start course/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN the course is recommended to a learner enrolled in nothing", () => {
    test("WHEN it renders THEN it reads recommended AND carries no enrolled mark", () => {
      renderInLocale(
        <CourseCinemaHero
          model={modelOf(aCourseView("basic-course", 1, [1, 3]), { enrolled: false })}
          label="recommended"
        />,
      );

      expect(screen.getByText("Recommended for you")).toBeInTheDocument();
      expect(screen.queryByText("Enrolled")).toBeNull();
      expect(screen.getByRole("link", { name: /Start course/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN every video watched", () => {
    test("WHEN it renders THEN the action reads Watch again", () => {
      const everyVideo = advanced.moduleSummaries.flatMap(({ lessons }) =>
        lessons.map(({ id }) => id),
      );

      renderInLocale(
        <CourseCinemaHero
          model={modelOf(advanced, { completed: everyVideo })}
          label="your-course"
        />,
      );

      expect(screen.getByRole("link", { name: /Watch again/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN the Spanish locale", () => {
    test("WHEN it renders THEN the copy comes from es.json", () => {
      renderInLocale(
        <CourseCinemaHero
          model={modelOf(advanced)}
          label="your-course"
        />,
        "es",
      );

      expect(screen.getByText("Tu curso")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Empezar el curso/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN a reference course the learner watched last", () => {
    const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2, 1]));

    test("WHEN it renders THEN its facts read Reference with no level number", () => {
      renderInLocale(
        <CourseCinemaHero
          model={modelOf(atlas, { recordAt: [0, 0] })}
          label="last-watched"
        />,
      );

      const hero = screen.getByTestId("course-cinema-hero");
      expect(hero).toHaveTextContent("Reference · 2 modules · 3 videos");
      expect(hero).not.toHaveTextContent(/Level \d/);
    });

    test("WHEN it renders in es THEN its facts read Referencia", () => {
      renderInLocale(
        <CourseCinemaHero
          model={modelOf(atlas, { recordAt: [0, 0] })}
          label="last-watched"
        />,
        "es",
      );

      expect(screen.getByTestId("course-cinema-hero")).toHaveTextContent(
        "Referencia · 2 módulos · 3 videos",
      );
    });
  });
});
