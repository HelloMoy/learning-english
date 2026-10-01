import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PendingCoursePage } from "./pending-course-page";

describe("PendingCoursePage", () => {
  describe("GIVEN a course title", () => {
    test("WHEN it renders THEN the title is the page's level-one heading", () => {
      // Arrange
      const title = faker.lorem.words(3);

      // Act
      render(<PendingCoursePage title={title} />);

      // Assert
      expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    });

    test("WHEN it renders THEN it offers no action", () => {
      // Arrange
      const title = faker.lorem.words(3);

      // Act
      render(<PendingCoursePage title={title} />);

      // Assert
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });
});
