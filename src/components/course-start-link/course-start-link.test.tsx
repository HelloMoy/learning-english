import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, everyVideoOf, lessonOf } from "@/test-setup/stubs/course-views";

import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseStartLink } from "./course-start-link";

const advanced = aCourseView("advanced-intermediate-course", 2, [3, 2]);
const firstVideoPath = `/courses/advanced-intermediate-course/modules/module-1/lessons/${lessonOf(advanced, 0, 0).id}`;

beforeEach(() => {
  givenLearner.enrolledCourses(["advanced-intermediate-course"]);
});

describe("CourseStartLink", () => {
  describe("GIVEN a learner with nothing watched", () => {
    test("WHEN it renders THEN Start course opens the first video", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseStartLink view={view} />);

      // Assert
      expect(screen.getByRole("link", { name: "Start course" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
    });

    test("WHEN rendered in pt THEN the label comes from pt.json", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseStartLink view={view} />, "pt");

      // Assert
      expect(screen.getByRole("link", { name: "Começar o curso" })).toBeInTheDocument();
    });

    test("WHEN the link is activated THEN onClick is told", async () => {
      // Arrange
      const user = userEvent.setup();
      const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      renderInLocale(
        <CourseStartLink
          view={advanced}
          onClick={onClick}
        />,
      );

      // Act
      await user.click(screen.getByRole("link", { name: "Start course" }));

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test("WHEN given a ref THEN the ref holds the link", () => {
      // Arrange
      const ref = { current: null as HTMLAnchorElement | null };

      // Act
      renderInLocale(
        <CourseStartLink
          view={advanced}
          ref={ref}
        />,
      );

      // Assert
      expect(ref.current).toBe(screen.getByRole("link", { name: "Start course" }));
    });
  });

  describe("GIVEN a learner with progress", () => {
    test("WHEN they have finished the recorded video THEN Continue where you left off opens the next one", () => {
      // Arrange
      const finished = lessonOf(advanced, 0, 0);
      act(() => {
        givenLearner.completed([finished.id]);
        givenLearner.continueWatching(
          ContinueWatchingLocation.parse({
            courseSlug: "advanced-intermediate-course",
            moduleSlug: "module-1",
            lessonId: finished.id,
          }),
        );
      });

      // Act
      renderInLocale(<CourseStartLink view={advanced} />);

      // Assert
      expect(screen.getByRole("link", { name: "Continue where you left off" })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-1/lessons/${lessonOf(advanced, 0, 1).id}`,
      );
    });

    test("WHEN they have watched everything THEN Watch again opens the first video", () => {
      // Arrange
      act(() => givenLearner.completed(everyVideoOf(advanced)));

      // Act
      renderInLocale(<CourseStartLink view={advanced} />);

      // Assert
      expect(screen.getByRole("link", { name: "Watch again" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
    });

    test("WHEN rendered in es THEN it reads Continuar donde lo dejaste", () => {
      // Arrange
      act(() => givenLearner.completed([lessonOf(advanced, 0, 0).id]));

      // Act
      renderInLocale(<CourseStartLink view={advanced} />, "es");

      // Assert
      expect(screen.getByRole("link", { name: "Continuar donde lo dejaste" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a course that holds no video", () => {
    test("WHEN it renders THEN nothing renders", () => {
      // Arrange
      const empty = aCourseView("advanced-intermediate-course", 2, [0]);

      // Act
      const { container } = renderInLocale(<CourseStartLink view={empty} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });
  });
});
