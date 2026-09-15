import { faker } from "@faker-js/faker";
import { renderHook } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useRuntimeLabel } from "./use-runtime-label";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const echoMessage = (key: string, values?: Record<string, unknown>) =>
  `${key}:${JSON.stringify(values)}`;

const labelFor = (seconds: number) => {
  const { result } = renderHook(() => useRuntimeLabel());
  return result.current(seconds);
};

describe("useRuntimeLabel", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => echoMessage as never);
  });

  describe("GIVEN a runtime shorter than an hour", () => {
    test("WHEN it is labelled THEN only minutes are stated", () => {
      // Arrange
      const minutes = faker.number.int({ min: 1, max: 59 });

      // Act
      const label = labelFor(minutes * 60);

      // Assert
      expect(label).toBe(echoMessage("durationMinutes", { minutes }));
    });
  });

  describe("GIVEN a runtime of whole hours", () => {
    test("WHEN it is labelled THEN only hours are stated", () => {
      // Arrange
      const hours = faker.number.int({ min: 1, max: 12 });

      // Act
      const label = labelFor(hours * 3600);

      // Assert
      expect(label).toBe(echoMessage("durationHours", { hours }));
    });
  });

  describe("GIVEN a runtime of hours and minutes", () => {
    test("WHEN it is labelled THEN both hours and minutes are stated", () => {
      // Arrange
      const hours = faker.number.int({ min: 1, max: 12 });
      const minutes = faker.number.int({ min: 1, max: 59 });

      // Act
      const label = labelFor(hours * 3600 + minutes * 60);

      // Assert
      expect(label).toBe(echoMessage("durationHoursMinutes", { hours, minutes }));
    });
  });

  describe("GIVEN the translations the labels come from", () => {
    test("WHEN the hook runs THEN it reads the course overview namespace", () => {
      // Arrange
      const mockUseTranslations = vi.mocked(useTranslations);

      // Act
      renderHook(() => useRuntimeLabel());

      // Assert
      expect(mockUseTranslations).toHaveBeenCalledWith("CourseCatalog.courseOverview");
    });
  });
});
