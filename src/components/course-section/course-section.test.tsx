import { faker } from "@faker-js/faker";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CourseSection } from "./course-section";

describe("CourseSection", () => {
  describe("GIVEN an eyebrow, a heading and content", () => {
    test("WHEN it renders THEN it is a region named by its heading AND holds the content", () => {
      // Arrange
      const eyebrow = faker.lorem.words(2);
      const heading = faker.lorem.sentence();
      const content = faker.lorem.paragraph();

      // Act
      render(
        <CourseSection
          eyebrow={eyebrow}
          heading={heading}
        >
          <p>{content}</p>
        </CourseSection>,
      );

      // Assert
      const region = screen.getByRole("region", { name: heading });
      expect(within(region).getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
      expect(within(region).getByText(eyebrow)).toBeInTheDocument();
      expect(within(region).getByText(content)).toBeInTheDocument();
    });
  });
});
