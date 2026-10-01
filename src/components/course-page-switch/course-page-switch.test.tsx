import { enrollInCourse } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { act, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CoursePageSwitch } from "./course-page-switch";

const COURSE_SLUG = "advanced-intermediate-course";
const title = faker.lorem.words(3);

function renderSwitch() {
  return renderInLocale(
    <CoursePageSwitch
      courseSlug={COURSE_SLUG}
      title={title}
      detail={<p>course page</p>}
      board={<p>progress board</p>}
    />,
  );
}

describe("CoursePageSwitch", () => {
  describe("GIVEN the learner store has not been seeded", () => {
    test("WHEN it renders THEN the title is the page heading AND neither page renders", () => {
      // Arrange
      resetLearnerStore();

      // Act
      renderSwitch();

      // Assert
      expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      expect(screen.queryByText("course page")).not.toBeInTheDocument();
      expect(screen.queryByText("progress board")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a learner not enrolled in the course", () => {
    test("WHEN the store is seeded THEN the course page renders", () => {
      // Arrange
      givenLearner.enrolledCourses(["basic-course"]);

      // Act
      renderSwitch();

      // Assert
      expect(screen.getByText("course page")).toBeInTheDocument();
      expect(screen.queryByText("progress board")).not.toBeInTheDocument();
    });

    test("WHEN they enroll from the course page THEN the course page stays", () => {
      // Arrange
      givenLearner.enrolledCourses([]);
      renderSwitch();

      // Act
      act(() => enrollInCourse(COURSE_SLUG));

      // Assert
      expect(screen.getByText("course page")).toBeInTheDocument();
      expect(screen.queryByText("progress board")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a learner enrolled in the course", () => {
    test("WHEN the store is seeded THEN the progress board renders", () => {
      // Arrange
      givenLearner.enrolledCourses([COURSE_SLUG]);

      // Act
      renderSwitch();

      // Assert
      expect(screen.getByText("progress board")).toBeInTheDocument();
      expect(screen.queryByText("course page")).not.toBeInTheDocument();
    });

    test("WHEN the store is seeded after the first render THEN the progress board renders", () => {
      // Arrange
      renderSwitch();

      // Act
      act(() => givenLearner.enrolledCourses([COURSE_SLUG]));

      // Assert
      expect(screen.getByText("progress board")).toBeInTheDocument();
    });
  });
});
