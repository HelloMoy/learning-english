import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";

import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseEnrollAction } from "./course-enroll-action";

const advanced = aCourseView("advanced-intermediate-course", 2, [3, 2]);
const firstVideoPath = `/courses/advanced-intermediate-course/modules/module-1/lessons/${lessonOf(advanced, 0, 0).id}`;

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
  givenLearner.enrolledCourses([]);
});

describe("CourseEnrollAction", () => {
  describe("GIVEN a learner not enrolled in the course", () => {
    test("WHEN it renders THEN it offers Enroll AND no Start course", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseEnrollAction view={view} />);

      // Assert
      expect(screen.getByRole("button", { name: "Enroll" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Start course" })).not.toBeInTheDocument();
    });

    test("WHEN Enroll is activated THEN Start course opens the first video at once AND the enrollment is saved", async () => {
      // Arrange
      const user = userEvent.setup();
      renderInLocale(<CourseEnrollAction view={advanced} />);

      // Act
      await user.click(screen.getByRole("button", { name: "Enroll" }));

      // Assert
      expect(screen.getByRole("link", { name: "Start course" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
      expect(enrollInCourseAction).toHaveBeenCalledWith({
        courseSlug: "advanced-intermediate-course",
      });
    });

    test("WHEN the server refuses the enrollment THEN Enroll is offered again", async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(enrollInCourseAction).mockResolvedValueOnce({ serverError: "refused" });
      renderInLocale(<CourseEnrollAction view={advanced} />);

      // Act
      await user.click(screen.getByRole("button", { name: "Enroll" }));

      // Assert
      expect(await screen.findByRole("button", { name: "Enroll" })).toBeInTheDocument();
      expect(learnerStore.getState().enrolledCourses.has("advanced-intermediate-course")).toBe(
        false,
      );
    });

    test("WHEN rendered in es THEN Enroll comes from es.json", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseEnrollAction view={view} />, "es");

      // Assert
      expect(screen.getByRole("button", { name: "Inscribirme" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner enrolled in the course", () => {
    test("WHEN it renders THEN Start course opens the first video", () => {
      // Arrange
      act(() => givenLearner.enrolledCourses(["advanced-intermediate-course"]));

      // Act
      renderInLocale(<CourseEnrollAction view={advanced} />, "pt");

      // Assert
      expect(screen.getByRole("link", { name: "Começar o curso" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
    });

    test("WHEN the course holds no video THEN nothing renders", () => {
      // Arrange
      const empty = aCourseView("advanced-intermediate-course", 2, [0]);
      act(() => givenLearner.enrolledCourses(["advanced-intermediate-course"]));

      // Act
      renderInLocale(<CourseEnrollAction view={empty} />);

      // Assert
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
