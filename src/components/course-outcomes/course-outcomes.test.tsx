import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CourseOutcomes } from "./course-outcomes";

describe("CourseOutcomes", () => {
  describe("GIVEN a course that declares outcomes", () => {
    test("WHEN it renders THEN every outcome is listed in the declared order", () => {
      // Arrange
      const outcomes = faker.helpers.multiple(() => faker.lorem.sentence(), { count: 5 });

      // Act
      renderInLocale(<CourseOutcomes outcomes={outcomes} />);

      // Assert
      const section = screen.getByRole("region", { name: "By the last video you’ll be able to" });
      const items = within(section).getAllByRole("listitem");
      expect(items.map((item) => item.textContent)).toEqual(outcomes);
    });

    test("WHEN rendered in es THEN the heading comes from es.json", () => {
      // Arrange
      const outcomes = [faker.lorem.sentence()];

      // Act
      renderInLocale(<CourseOutcomes outcomes={outcomes} />, "es");

      // Assert
      expect(screen.getByText("Lo que vas a aprender")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Al terminar el último video podrás" }),
      ).toBeInTheDocument();
    });
  });

  describe("GIVEN a course that declares no outcomes", () => {
    test("WHEN it renders THEN no section AND no heading render", () => {
      // Arrange
      const outcomes: string[] = [];

      // Act
      const { container } = renderInLocale(<CourseOutcomes outcomes={outcomes} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });
  });
});
