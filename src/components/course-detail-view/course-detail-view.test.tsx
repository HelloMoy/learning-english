import { Course } from "@/domain/entities/course/course";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView } from "@/test-setup/stubs/course-views";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { CourseDetailView } from "./course-detail-view";

function teaching(view: CourseForView, extra: Partial<Course>): CourseForView {
  return { ...view, course: Course.parse({ ...view.course, ...extra }) };
}

const outcomes = faker.helpers.multiple(() => faker.lorem.sentence(), { count: 4 });
const sounds = { vowels: ["ə", "ɪ"], consonants: ["θ"] };

beforeEach(() => {
  givenLearner.enrolledCourses([]);
});

describe("CourseDetailView", () => {
  describe("GIVEN a course that declares outcomes and sounds", () => {
    test("WHEN it renders THEN the hero, outcomes, sounds, syllabus AND enroll card follow in that order", () => {
      // Arrange
      const view = teaching(aCourseView("basic-course", 1, [1, 2]), { outcomes, sounds });

      // Act
      renderInLocale(<CourseDetailView view={view} />);

      // Assert
      const headings = screen
        .getAllByRole("heading", { level: 1 })
        .concat(screen.getAllByRole("heading", { level: 2 }))
        .map((heading) => heading.textContent);
      expect(headings).toEqual([
        view.course.title,
        "By the last video you’ll be able to",
        "3 sounds you’ll master",
        "2 lessons, one prize each",
        "Join this course",
      ]);
    });

    test("WHEN it renders THEN the phone bar offers Enroll too", () => {
      // Arrange
      const view = teaching(aCourseView("basic-course", 1, [1, 2]), { outcomes, sounds });

      // Act
      renderInLocale(<CourseDetailView view={view} />);

      // Assert
      expect(screen.getByRole("complementary", { name: "Join this course" })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Enroll" })).toHaveLength(3);
    });
  });

  describe("GIVEN a course whose outcomes are translated into Portuguese", () => {
    test("WHEN it renders in pt THEN What you'll learn lists the Portuguese outcomes", () => {
      // Arrange
      const portuguese = faker.helpers.multiple(() => faker.lorem.sentence(), { count: 4 });
      const view = teaching(aCourseView("basic-course", 1, [1]), {
        outcomes,
        translations: { pt: { outcomes: portuguese } },
      });

      // Act
      renderInLocale(<CourseDetailView view={view} />, "pt");

      // Assert
      const section = screen.getByRole("region", {
        name: "Ao terminar o último vídeo, você vai conseguir",
      });
      expect(
        within(section)
          .getAllByRole("listitem")
          .map((item) => item.textContent),
      ).toEqual(portuguese);
    });
  });

  describe("GIVEN a course that declares neither outcomes nor sounds", () => {
    test("WHEN it renders THEN neither section renders", () => {
      // Arrange
      const view = aCourseView("advanced-intermediate-course", 2, [3]);

      // Act
      renderInLocale(<CourseDetailView view={view} />);

      // Assert
      expect(
        screen.queryByRole("region", { name: "By the last video you’ll be able to" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: /sounds you’ll master/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "1 lesson, one prize" })).toBeInTheDocument();
    });
  });
});
