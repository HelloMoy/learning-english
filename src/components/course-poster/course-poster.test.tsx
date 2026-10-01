import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import {
  aCardModel,
  aCourseView,
  asReference,
  everyVideoOf,
  lessonOf,
} from "@/test-setup/stubs/course-views";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CoursePoster } from "./course-poster";

const withAudience = (view: CourseForView, audience: string): CourseForView => ({
  ...view,
  course: { ...view.course, audience },
});

const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);
const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2, 1]));

const poster = () => screen.getByTestId("course-poster");

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
});

describe("CoursePoster", () => {
  describe("GIVEN an enrolled course the learner left part-way into a video", () => {
    const target = lessonOf(advanced, 1, 0);
    const model = aCardModel(advanced, {
      recordAt: [1, 0],
      positions: new Map([[target.id, 365]]),
      completed: [lessonOf(advanced, 0, 0).id],
    });

    test("WHEN it renders THEN it is levelled, enrolled AND titled by the course", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "enrolled", model }} />);

      // Assert
      expect(within(poster()).getByText("Level 2")).toBeInTheDocument();
      expect(within(poster()).getByText("Enrolled")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: advanced.course.title }),
      ).toBeInTheDocument();
    });

    test("WHEN it renders THEN it says where to resume AND Continue course opens that video", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "enrolled", model }} />);

      // Assert
      expect(poster()).toHaveTextContent(`Resume at 06:05 · ${target.title}`);
      expect(screen.getByRole("link", { name: /Continue course/ })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-2/lessons/${target.id}`,
      );
      expect(screen.getByRole("link", { name: "View progress" })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course/progress",
      );
    });

    test("WHEN it renders THEN the ring, the progress line AND the edge show a quarter done", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "enrolled", model }} />);

      // Assert
      expect(poster()).toHaveTextContent("25%");
      expect(poster()).toHaveTextContent(/1 of 4 videos · \d+ min left/);
      expect(screen.getByTestId("course-poster-edge")).toHaveStyle({ width: "25%" });
    });
  });

  describe("GIVEN an enrolled course never opened", () => {
    test("WHEN it renders THEN it names the next video AND offers Start course", () => {
      // Arrange
      const model = aCardModel(advanced);

      // Act
      renderInLocale(<CoursePoster entry={{ kind: "enrolled", model }} />);

      // Assert
      expect(poster()).toHaveTextContent(`Next up · ${lessonOf(advanced, 0, 0).title}`);
      expect(screen.getByRole("link", { name: /Start course/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN an enrolled course in Spanish", () => {
    test("WHEN it renders THEN its secondary action reads Ver avance", () => {
      // Act
      renderInLocale(
        <CoursePoster entry={{ kind: "enrolled", model: aCardModel(advanced) }} />,
        "es",
      );

      // Assert
      expect(screen.getByRole("link", { name: "Ver avance" })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course/progress",
      );
    });
  });

  describe("GIVEN an enrolled course whose every video is complete", () => {
    test("WHEN it renders THEN it reads Completed AND All watched AND offers Watch again", () => {
      // Arrange
      const model = aCardModel(advanced, { completed: everyVideoOf(advanced) });

      // Act
      renderInLocale(<CoursePoster entry={{ kind: "enrolled", model }} />);

      // Assert
      expect(within(poster()).getByText("Completed")).toBeInTheDocument();
      expect(within(poster()).queryByText("Enrolled")).toBeNull();
      expect(poster()).toHaveTextContent("All watched");
      expect(screen.getByRole("link", { name: /Watch again/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN an enrolled reference course", () => {
    test("WHEN it renders THEN it reads Reference with no level number", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "enrolled", model: aCardModel(atlas) }} />);

      // Assert
      expect(within(poster()).getByText("Reference")).toBeInTheDocument();
      expect(poster()).not.toHaveTextContent(/Level \d/);
    });
  });

  describe("GIVEN a course that declares an audience", () => {
    test("WHEN it renders THEN the poster carries the course brief", () => {
      // Arrange
      const audience = faker.lorem.sentence();

      // Act
      renderInLocale(
        <CoursePoster entry={{ kind: "joinable", view: withAudience(advanced, audience) }} />,
      );

      // Assert
      expect(within(screen.getByTestId("course-brief")).getByText(audience)).toBeInTheDocument();
    });
  });

  describe("GIVEN a course the learner has not joined", () => {
    test("WHEN it renders THEN it shows its level, size AND prizes, and no enrolled mark", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "joinable", view: advanced }} />);

      // Assert
      expect(within(poster()).getByText("Level 2")).toBeInTheDocument();
      expect(poster()).toHaveTextContent("2 modules · 4 videos · 40 min");
      expect(poster()).toHaveTextContent("2 prizes to win");
      expect(within(poster()).queryByText("Enrolled")).toBeNull();
      expect(screen.queryByTestId("course-poster-edge")).toBeNull();
    });

    test("WHEN View details is read THEN it opens the course page", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "joinable", view: advanced }} />);

      // Assert
      expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course/about",
      );
    });

    test("WHEN Enroll is read THEN it opens the course page", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "joinable", view: advanced }} />);

      // Assert
      expect(screen.getByRole("link", { name: "Enroll" })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course/about",
      );
    });

    test("WHEN Enroll is activated THEN the learner is not enrolled AND nothing is saved", async () => {
      // Arrange
      const user = userEvent.setup();
      renderInLocale(<CoursePoster entry={{ kind: "joinable", view: advanced }} />);

      // Act
      await user.click(screen.getByRole("link", { name: "Enroll" }));

      // Assert
      expect(learnerStore.getState().enrolledCourses.has("advanced-intermediate-course")).toBe(
        false,
      );
      expect(enrollInCourseAction).not.toHaveBeenCalled();
    });

    test("WHEN rendered in es THEN the copy comes from es.json", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "joinable", view: atlas }} />, "es");

      // Assert
      expect(within(poster()).getByText("Referencia")).toBeInTheDocument();
      expect(poster()).toHaveTextContent("2 premios por ganar");
      expect(screen.getByRole("link", { name: "Ver detalles" })).toBeInTheDocument();
    });

    test("WHEN rendered in es THEN Inscribirme opens the course page", () => {
      // Act
      renderInLocale(<CoursePoster entry={{ kind: "joinable", view: atlas }} />, "es");

      // Assert
      expect(screen.getByRole("link", { name: "Inscribirme" })).toHaveAttribute(
        "href",
        "/courses/atlas-of-american-sounds/about",
      );
    });
  });
});
