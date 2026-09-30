import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { CourseSyllabus } from "./course-syllabus";

const view = aCourseView("basic-course", 1, [1, 3, 2]);

const lessonRows = (listName = "Lessons in order") =>
  within(screen.getByRole("list", { name: listName })).getAllByRole("group");

describe("CourseSyllabus", () => {
  describe("GIVEN a course with three lessons", () => {
    test("WHEN it renders THEN the heading counts the lessons", () => {
      // Arrange
      const course = view;

      // Act
      renderInLocale(<CourseSyllabus view={course} />);

      // Assert
      expect(
        screen.getByRole("heading", { level: 2, name: "3 lessons, one prize each" }),
      ).toBeInTheDocument();
    });

    test("WHEN it renders THEN the lessons are titled in sequence order", () => {
      // Arrange
      const course = view;

      // Act
      renderInLocale(<CourseSyllabus view={course} />);

      // Assert
      expect(
        screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
      ).toEqual(course.modules.map((courseModule) => courseModule.title));
    });

    test("WHEN it renders THEN each lesson states its ordinal, video count AND runtime", () => {
      // Arrange
      const course = view;

      // Act
      renderInLocale(<CourseSyllabus view={course} />);

      // Assert
      const second = lessonRows()[1]!;
      expect(within(second).getByText("Lesson 2")).toBeInTheDocument();
      expect(within(second).getByText("3 videos · 30 min")).toBeInTheDocument();
    });

    test("WHEN it renders THEN every lesson starts closed", () => {
      // Arrange
      const course = view;

      // Act
      renderInLocale(<CourseSyllabus view={course} />);

      // Assert
      for (const row of lessonRows()) expect(row).not.toHaveAttribute("open");
    });

    test("WHEN a lesson is opened THEN its videos are listed with ordinal, title AND duration", async () => {
      // Arrange
      const user = userEvent.setup();
      renderInLocale(<CourseSyllabus view={view} />);
      const second = lessonRows()[1]!;

      // Act
      await user.click(within(second).getByRole("heading", { name: view.modules[1]!.title }));

      // Assert
      expect(second).toHaveAttribute("open");
      const videos = within(within(second).getByRole("list")).getAllByRole("listitem");
      expect(videos.map((video) => video.textContent)).toEqual([
        `Video 1${lessonOf(view, 1, 0).title}10:00`,
        `Video 2${lessonOf(view, 1, 1).title}10:00`,
        `Video 3${lessonOf(view, 1, 2).title}10:00`,
      ]);
    });

    test("WHEN rendered in es THEN ordinals AND counts come from es.json", () => {
      // Arrange
      const course = view;

      // Act
      renderInLocale(<CourseSyllabus view={course} />, "es");

      // Assert
      const second = lessonRows("Lecciones en orden")[1]!;
      expect(within(second).getByText("Lección 2")).toBeInTheDocument();
      expect(within(second).getByText("3 videos · 30 min")).toBeInTheDocument();
    });
  });
});
