import { LessonCompletionMark } from "@/components/lesson-completion-mark/lesson-completion-mark";
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
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });

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
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });
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
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });
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

describe("MarkAsCompleteButton — durable completion", () => {
  const STORAGE_KEY_PREFIX = "learning-english:completed:";
  const lessonId = LessonId.parse("77777777-7777-4777-8777-777777777777");

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

  test("WHEN the lesson was already completed THEN the button mounts as completed", () => {
    // Arrange — the regression this fixes: the button used to start at
    // useState(false) and forget across reloads.
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    // Act
    render(
      <MarkAsCompleteButton
        lessonId={lessonId}
        markComplete={async () => ({ data: { completed: true } })}
      />,
    );

    // Assert
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  test("WHEN clicked THEN the lesson is recorded in the durable browser store", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MarkAsCompleteButton
        lessonId={lessonId}
        markComplete={async () => ({ data: { completed: true } })}
      />,
    );

    // Act
    await user.click(screen.getByRole("button"));

    // Assert — the mark survives a reload because it is in storage, not state.
    expect(window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${lessonId}`)).not.toBeNull();
  });

  test("WHEN clicked THEN an indicator rendered alongside observes it without a reload", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <>
        <MarkAsCompleteButton
          lessonId={lessonId}
          markComplete={async () => ({ data: { completed: true } })}
        />
        <LessonCompletionMark lessonId={lessonId} />
      </>,
    );
    expect(screen.queryByTestId("lesson-completion-mark")).toBeNull();

    // Act
    await user.click(screen.getByRole("button"));

    // Assert — the shared store is what makes the two agree.
    expect(await screen.findByTestId("lesson-completion-mark")).toBeInTheDocument();
  });
});
