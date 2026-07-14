import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { MarkAsCompleteButton } from "./mark-as-complete-button";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("MarkAsCompleteButton", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it shows the 'Mark as complete' label", () => {
    // Arrange
    const markComplete = vi.fn().mockResolvedValue({ completed: true });

    // Act
    render(
      <MarkAsCompleteButton
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={markComplete}
      />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "markComplete" })).toBeInTheDocument();
  });

  test("WHEN clicked THEN it calls markComplete with the lessonId and toggles the label", async () => {
    // Arrange
    const lessonId = LessonId.parse(faker.string.uuid());
    const markComplete = vi.fn().mockResolvedValue({ completed: true });
    const user = userEvent.setup();

    // Act
    render(
      <MarkAsCompleteButton
        lessonId={lessonId}
        markComplete={markComplete}
      />,
    );
    await user.click(screen.getByRole("button"));

    // Assert
    expect(markComplete).toHaveBeenCalledWith({ lessonId });
    expect(await screen.findByRole("button", { name: "markedComplete" })).toBeInTheDocument();
  });

  test("WHEN completed THEN the button is disabled", async () => {
    // Arrange
    const markComplete = vi.fn().mockResolvedValue({ completed: true });
    const user = userEvent.setup();

    // Act
    render(
      <MarkAsCompleteButton
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={markComplete}
      />,
    );
    await user.click(screen.getByRole("button"));
    const button = await screen.findByRole("button", { name: "markedComplete" });

    // Assert
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
