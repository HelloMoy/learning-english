import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView } from "@/test-setup/stubs/course-views";

import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { CourseEnrollCard } from "./course-enroll-card";

// 63 ten-minute videos: 10 h 30 min, 32 days at 20 min a day.
const course = aCourseView("basic-course", 1, [1, 17, 25, 4, 16]);

beforeEach(() => {
  givenLearner.enrolledCourses([]);
});

describe("CourseEnrollCard", () => {
  describe("GIVEN a learner not enrolled in the course", () => {
    test("WHEN it renders THEN it invites them to join AND offers Enroll", () => {
      // Arrange
      const view = course;

      // Act
      renderInLocale(<CourseEnrollCard view={view} />);

      // Assert
      expect(
        screen.getByRole("heading", { level: 2, name: "Join this course" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Enroll" })).toBeInTheDocument();
    });

    test("WHEN it renders THEN it states the course's videos, runtime, lessons AND prizes", () => {
      // Arrange
      const view = course;

      // Act
      renderInLocale(<CourseEnrollCard view={view} />);

      // Assert
      const stats = screen.getByRole("list", { name: "Course size" });
      expect(stats).toHaveTextContent("63videos");
      expect(stats).toHaveTextContent("10 h 30 minof video");
      expect(stats).toHaveTextContent("5lessons");
      expect(stats).toHaveTextContent("5prizes to redeem");
    });

    test("WHEN it renders THEN 20 minutes a day is selected AND the pace reads about 5 weeks", () => {
      // Arrange
      const view = course;

      // Act
      renderInLocale(<CourseEnrollCard view={view} />);

      // Assert
      expect(screen.getByRole("radio", { name: "20 min" })).toBeChecked();
      expect(screen.getByText("At 20 min a day, you finish in about 5 weeks.")).toBeInTheDocument();
    });

    test("WHEN the learner picks 45 minutes a day THEN the pace reads about 2 weeks", async () => {
      // Arrange
      const user = userEvent.setup();
      renderInLocale(<CourseEnrollCard view={course} />);

      // Act
      await user.click(screen.getByRole("radio", { name: "45 min" }));

      // Assert
      expect(screen.getByRole("radio", { name: "45 min" })).toBeChecked();
      expect(screen.getByText("At 45 min a day, you finish in about 2 weeks.")).toBeInTheDocument();
    });

    test("WHEN rendered in es THEN the pace line comes from es.json", () => {
      // Arrange
      const view = course;

      // Act
      renderInLocale(<CourseEnrollCard view={view} />, "es");

      // Assert
      expect(screen.getByText("A 20 min al día, terminas en unas 5 semanas.")).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner enrolled in the course", () => {
    test("WHEN it renders THEN it says they are enrolled AND offers Start course", () => {
      // Arrange
      act(() => givenLearner.enrolledCourses(["basic-course"]));

      // Act
      renderInLocale(<CourseEnrollCard view={course} />);

      // Assert
      expect(
        screen.getByRole("heading", { level: 2, name: "You’re enrolled" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Start course" })).toBeInTheDocument();
    });
  });
});
