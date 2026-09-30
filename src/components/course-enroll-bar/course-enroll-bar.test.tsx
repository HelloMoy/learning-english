import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView } from "@/test-setup/stubs/course-views";

import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { CourseEnrollBar } from "./course-enroll-bar";

const advanced = aCourseView("advanced-intermediate-course", 2, [4, 2]);

beforeEach(() => {
  givenLearner.enrolledCourses([]);
});

describe("CourseEnrollBar", () => {
  describe("GIVEN a learner not enrolled in the course", () => {
    test("WHEN it renders THEN it names the course, its size AND offers Enroll", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseEnrollBar view={view} />);

      // Assert
      const bar = screen.getByRole("complementary", { name: "Join this course" });
      expect(within(bar).getByText(view.course.title)).toBeInTheDocument();
      expect(within(bar).getByText("6 videos · 1 h")).toBeInTheDocument();
      expect(within(bar).getByRole("button", { name: "Enroll" })).toBeInTheDocument();
    });

    test("WHEN rendered in pt THEN its size comes from pt.json", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseEnrollBar view={view} />, "pt");

      // Assert
      const bar = screen.getByRole("complementary", { name: "Entre neste curso" });
      expect(within(bar).getByText("6 vídeos · 1 h")).toBeInTheDocument();
    });
  });
});
