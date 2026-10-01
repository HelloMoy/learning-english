import type { Course } from "@/domain/entities/course/course";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView } from "@/test-setup/stubs/course-views";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CourseBrief } from "./course-brief";

const points = (count: number) => faker.helpers.multiple(() => faker.lorem.words(3), { count });

const courseWith = (brief: Partial<Pick<Course, "audience" | "highlights" | "translations">>) => ({
  ...aCourseView("basic-course", 1, [1]).course,
  ...brief,
});

describe("CourseBrief", () => {
  describe("GIVEN a course that declares an audience and highlights", () => {
    test("WHEN it renders THEN For names the audience AND You'll learn lists the highlights in order", () => {
      // Arrange
      const audience = faker.lorem.sentence();
      const highlights = points(3);

      // Act
      renderInLocale(<CourseBrief course={courseWith({ audience, highlights })} />);

      // Assert
      const brief = screen.getByTestId("course-brief");
      expect(within(brief).getByText("For")).toBeInTheDocument();
      expect(within(brief).getByText(audience)).toBeInTheDocument();
      expect(within(brief).getByText("You’ll learn")).toBeInTheDocument();
      const items = within(brief).getAllByRole("listitem");
      expect(items.map((item) => item.textContent)).toEqual(highlights);
    });

    test("WHEN rendered in es THEN the labels AND the copy are the Spanish ones", () => {
      // Arrange
      const spanish = { audience: faker.lorem.sentence(), highlights: points(3) };
      const course = courseWith({
        audience: faker.lorem.sentence(),
        highlights: points(3),
        translations: { es: spanish },
      });

      // Act
      renderInLocale(<CourseBrief course={course} />, "es");

      // Assert
      expect(screen.getByText("Para")).toBeInTheDocument();
      expect(screen.getByText(spanish.audience)).toBeInTheDocument();
      expect(screen.getByText("Aprenderás")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(
        spanish.highlights,
      );
    });
  });

  describe("GIVEN a course that declares highlights but no audience", () => {
    test("WHEN it renders THEN there is no For line", () => {
      // Arrange
      const course = courseWith({ highlights: points(2) });

      // Act
      renderInLocale(<CourseBrief course={course} />);

      // Assert
      expect(screen.queryByText("For")).not.toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });
  });

  describe("GIVEN a course that declares neither", () => {
    test("WHEN it renders THEN nothing renders", () => {
      // Arrange
      const course = courseWith({});

      // Act
      const { container } = renderInLocale(<CourseBrief course={course} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });
  });
});
