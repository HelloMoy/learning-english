import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CoursePageGate } from "./course-page-gate";

const title = faker.lorem.words(3);

function renderGate() {
  return render(
    <CoursePageGate title={title}>
      <p>course page</p>
    </CoursePageGate>,
  );
}

describe("CoursePageGate", () => {
  describe("GIVEN the learner store has not been seeded", () => {
    test("WHEN it renders THEN the title is the page heading AND the page is withheld", () => {
      // Arrange
      resetLearnerStore();

      // Act
      renderGate();

      // Assert
      expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      expect(screen.queryByText("course page")).not.toBeInTheDocument();
    });

    test("WHEN the store is seeded THEN the page replaces the pending shape", () => {
      // Arrange
      resetLearnerStore();
      renderGate();

      // Act
      act(() => givenLearner.enrolledCourses([]));

      // Assert
      expect(screen.getByText("course page")).toBeInTheDocument();
      expect(screen.queryByTestId("course-page-pending")).not.toBeInTheDocument();
    });
  });
});
