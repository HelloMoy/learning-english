import { Course } from "@/domain/entities/course/course";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, asReference, lessonOf } from "@/test-setup/stubs/course-views";

import { faker } from "@faker-js/faker";
import { act, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { CourseDetailHero } from "./course-detail-hero";

// Five lessons, 48 ten-minute videos: 8 h of video.
const basic = aCourseView("basic-course", 1, [1, 17, 25, 4, 1]);

beforeEach(() => {
  givenLearner.enrolledCourses([]);
});

describe("CourseDetailHero", () => {
  describe("GIVEN a level course the learner has not joined", () => {
    test("WHEN it renders THEN it marks the level AND states the facts line", () => {
      // Arrange
      const view = basic;

      // Act
      renderInLocale(<CourseDetailHero view={view} />);

      // Assert
      const hero = screen.getByTestId("course-detail-hero");
      expect(within(hero).getByText("Level 1")).toBeInTheDocument();
      expect(within(hero).getByText("Level 1 · 5 lessons · 48 videos · 8 h")).toBeInTheDocument();
    });

    test("WHEN it renders THEN the title is the page heading AND the description follows", () => {
      // Arrange
      const view = basic;

      // Act
      renderInLocale(<CourseDetailHero view={view} />);

      // Assert
      expect(
        screen.getByRole("heading", { level: 1, name: view.course.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(view.course.description)).toBeInTheDocument();
    });

    test("WHEN it renders THEN the first video is named without linking to it", () => {
      // Arrange
      const view = basic;

      // Act
      renderInLocale(<CourseDetailHero view={view} />);

      // Assert
      const chip = screen.getByTestId("course-detail-hero-first-video");
      expect(chip).toHaveTextContent(`First video${lessonOf(view, 0, 0).title}10:00`);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    test("WHEN it renders THEN it counts the course's prizes AND offers Enroll", () => {
      // Arrange
      const view = basic;

      // Act
      renderInLocale(<CourseDetailHero view={view} />);

      // Assert
      expect(screen.getByText("5 prizes")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Enroll" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a course translated into Spanish", () => {
    test("WHEN it renders in es THEN the description is the Spanish one AND the title is unchanged", () => {
      // Arrange
      const spanish = faker.lorem.sentence();
      const view = {
        ...basic,
        course: Course.parse({ ...basic.course, translations: { es: { description: spanish } } }),
      };

      // Act
      renderInLocale(<CourseDetailHero view={view} />, "es");

      // Assert
      expect(screen.getByText(spanish)).toBeInTheDocument();
      expect(screen.queryByText(view.course.description)).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: view.course.title }),
      ).toBeInTheDocument();
    });
  });

  describe("GIVEN a reference course", () => {
    test("WHEN it renders THEN it reads Reference AND no level number", () => {
      // Arrange
      const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2, 10]));

      // Act
      renderInLocale(<CourseDetailHero view={atlas} />, "es");

      // Assert
      const hero = screen.getByTestId("course-detail-hero");
      expect(within(hero).getByText("Referencia")).toBeInTheDocument();
      expect(within(hero).getByText(/^Referencia · 2 lecciones · 12 videos/)).toBeInTheDocument();
      expect(within(hero).queryByText(/Nivel \d/)).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a learner who has joined the course", () => {
    test("WHEN it renders THEN the mark reads Enrolled AND Start course is offered", () => {
      // Arrange
      act(() => givenLearner.enrolledCourses(["basic-course"]));

      // Act
      renderInLocale(<CourseDetailHero view={basic} />);

      // Assert
      const hero = screen.getByTestId("course-detail-hero");
      expect(within(hero).getByText("Enrolled")).toBeInTheDocument();
      expect(within(hero).queryByText("Level 1")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Start course" })).toBeInTheDocument();
    });
  });
});
