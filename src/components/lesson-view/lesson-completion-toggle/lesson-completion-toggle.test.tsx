import { LessonCompletionMark } from "@/components/lesson-completion-mark/lesson-completion-mark";
import { LessonId } from "@/domain/entities/ids/ids";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonCompletionToggle } from "./lesson-completion-toggle";

const celebrate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/celebrate-completion/celebrate-completion", () => ({
  celebrateLessonCompletion: celebrate,
}));

vi.mock("next-intl", () => ({
  // The outline's watch-progress bar formats its percentage through next-intl
  // rather than concatenating a string, so the mock has to answer for the
  // formatter too.
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("LessonCompletionToggle", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN the lesson is incomplete THEN it invites the learner to finish it", () => {
    // Arrange — the invitation belongs to the control that owns the state,
    // not to the card around it: only one of them knows which state it is in.
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });

    // Act
    render(
      <LessonCompletionToggle
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={markComplete}
        unmarkComplete={vi.fn().mockResolvedValue({ data: { unmarked: true } })}
      />,
    );

    // Assert
    expect(screen.getByText("prompt")).toBeInTheDocument();
  });

  test("WHEN rendered THEN it shows the 'Mark as complete' label", () => {
    // Arrange
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });

    // Act
    render(
      <LessonCompletionToggle
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={markComplete}
        unmarkComplete={vi.fn().mockResolvedValue({ data: { unmarked: true } })}
      />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "markComplete" })).toBeInTheDocument();
  });

  test("WHEN clicked THEN it calls markComplete and swaps to the completed state", async () => {
    // Arrange
    const lessonId = LessonId.parse(faker.string.uuid());
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });
    const user = userEvent.setup();

    // Act
    render(
      <LessonCompletionToggle
        lessonId={lessonId}
        markComplete={markComplete}
        unmarkComplete={vi.fn().mockResolvedValue({ data: { unmarked: true } })}
      />,
    );
    await user.click(screen.getByRole("button"));

    // Assert
    expect(markComplete).toHaveBeenCalledWith({ lessonId });
    expect(await screen.findByText("completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "markComplete" })).toBeNull();
  });

  test("WHEN rendered THEN the button is full width on a phone and intrinsic from `lg` up", () => {
    // Arrange — inside the closing card the button is the block's primary
    // action, so it spans it; the desktop rendering must not change.
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });

    // Act
    render(
      <LessonCompletionToggle
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={markComplete}
        unmarkComplete={vi.fn().mockResolvedValue({ data: { unmarked: true } })}
      />,
    );

    // Assert
    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-full", "lg:w-auto");
    expect(button.parentElement).toHaveClass("items-stretch", "lg:items-start");
  });

  test("WHEN the lesson is complete THEN it states so once, announced, and disables nothing", async () => {
    // Arrange — the learner complained about reading "completed" twice: in
    // the button and again in the status line below it. It is said once now,
    // and the statement is the live region that announces the change.
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });
    const user = userEvent.setup();

    // Act
    render(
      <LessonCompletionToggle
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={markComplete}
        unmarkComplete={vi.fn().mockResolvedValue({ data: { unmarked: true } })}
      />,
    );
    await user.click(screen.getByRole("button"));
    const statement = await screen.findByText("completed");

    // Assert
    expect(screen.getAllByText("completed")).toHaveLength(1);
    expect(statement.closest("[aria-live]")).not.toBeNull();
    expect(screen.queryByText("prompt")).toBeNull();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeEnabled();
    }
  });
});

describe("LessonCompletionToggle — durable completion", () => {
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
      <LessonCompletionToggle
        lessonId={lessonId}
        markComplete={async () => ({ data: { completed: true } })}
        unmarkComplete={async () => ({ data: { unmarked: true } })}
      />,
    );

    // Assert
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "unmark" })).toBeEnabled();
  });

  test("WHEN clicked THEN the lesson is recorded in the durable browser store", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <LessonCompletionToggle
        lessonId={lessonId}
        markComplete={async () => ({ data: { completed: true } })}
        unmarkComplete={async () => ({ data: { unmarked: true } })}
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
        <LessonCompletionToggle
          lessonId={lessonId}
          markComplete={async () => ({ data: { completed: true } })}
          unmarkComplete={async () => ({ data: { unmarked: true } })}
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

describe("LessonCompletionToggle — undoing a completion", () => {
  const STORAGE_KEY_PREFIX = "learning-english:completed:";
  const lessonId = LessonId.parse("88888888-8888-4888-8888-888888888888");

  const renderCompleted = (
    unmarkComplete: (input: { lessonId: LessonId }) => Promise<{ data?: { unmarked: boolean } }>,
  ) => {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    return render(
      <NiceModal.Provider>
        <LessonCompletionToggle
          lessonId={lessonId}
          markComplete={async () => ({ data: { completed: true } })}
          unmarkComplete={unmarkComplete}
        />
      </NiceModal.Provider>,
    );
  };

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

  test("WHEN the lesson is complete THEN the statement and the undo share one row", () => {
    // Arrange & Act — the capability asks for a text action *beside* the
    // statement; stacked, the undo reads as a second, unrelated thing.
    renderCompleted(vi.fn());

    // Assert
    const statement = screen.getByText("completed");
    const unmark = screen.getByRole("button", { name: "unmark" });
    const row = unmark.parentElement;
    expect(row).toContainElement(statement);
    expect(row).toHaveClass("flex", "items-center", "justify-between");
  });

  test("WHEN the lesson is complete THEN the undo is a quiet, reachable control", () => {
    // Arrange & Act
    renderCompleted(vi.fn());

    // Assert — enabled, named for what it does, tappable, and carrying none
    // of the primary button's fill.
    const unmark = screen.getByRole("button", { name: "unmark" });
    expect(unmark).toBeEnabled();
    expect(unmark).toHaveClass("min-h-11");
    expect(unmark.className).not.toContain("bg-primary");
  });

  test("WHEN the undo is activated THEN it asks first and writes nothing", async () => {
    // Arrange
    const user = userEvent.setup();
    const unmarkComplete = vi.fn().mockResolvedValue({ data: { unmarked: true } });
    renderCompleted(unmarkComplete);

    // Act
    await user.click(screen.getByRole("button", { name: "unmark" }));

    // Assert — the dialog is open and the lesson is still complete.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(unmarkComplete).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${lessonId}`)).not.toBeNull();
  });
});

describe("LessonCompletionToggle — the outcome of the confirmation", () => {
  const STORAGE_KEY_PREFIX = "learning-english:completed:";
  const lessonId = LessonId.parse("99999999-9999-4999-8999-999999999999");
  const storedMark = () => window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${lessonId}`);

  const renderCompleted = (
    unmarkComplete: (input: {
      lessonId: LessonId;
    }) => Promise<{ data?: { unmarked: boolean } } | undefined>,
  ) => {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    return render(
      <NiceModal.Provider>
        <LessonCompletionToggle
          lessonId={lessonId}
          markComplete={async () => ({ data: { completed: true } })}
          unmarkComplete={unmarkComplete}
        />
      </NiceModal.Provider>,
    );
  };

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

  test("WHEN the learner confirms THEN both trackers are cleared and the invitation returns", async () => {
    // Arrange
    const user = userEvent.setup();
    const unmarkComplete = vi.fn().mockResolvedValue({ data: { unmarked: true } });
    renderCompleted(unmarkComplete);

    // Act
    await user.click(screen.getByRole("button", { name: "unmark" }));
    await user.click(await screen.findByRole("button", { name: "confirm" }));

    // Assert — the server's tracker and the browser's agree, and the control
    // is back to offering the lesson.
    expect(unmarkComplete).toHaveBeenCalledWith({ lessonId });
    expect(await screen.findByRole("button", { name: "markComplete" })).toBeInTheDocument();
    expect(storedMark()).toBeNull();
  });

  test("WHEN the learner cancels THEN the lesson stays complete", async () => {
    // Arrange
    const user = userEvent.setup();
    const unmarkComplete = vi.fn().mockResolvedValue({ data: { unmarked: true } });
    renderCompleted(unmarkComplete);

    // Act
    await user.click(screen.getByRole("button", { name: "unmark" }));
    await user.click(await screen.findByRole("button", { name: "cancel" }));

    // Assert
    expect(unmarkComplete).not.toHaveBeenCalled();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(storedMark()).not.toBeNull();
  });

  test("WHEN the Server Action rejects the input THEN the mark is left alone", async () => {
    // Arrange — a result without `data` means validation rejected it; the
    // browser's record must not be cleared on the strength of a failed call.
    const user = userEvent.setup();
    const unmarkComplete = vi.fn().mockResolvedValue({ validationErrors: {} });
    renderCompleted(unmarkComplete);

    // Act
    await user.click(screen.getByRole("button", { name: "unmark" }));
    await user.click(await screen.findByRole("button", { name: "confirm" }));

    // Assert
    expect(unmarkComplete).toHaveBeenCalled();
    expect(storedMark()).not.toBeNull();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });
});

describe("LessonCompletionToggle — celebrating the finish", () => {
  const STORAGE_KEY_PREFIX = "learning-english:completed:";
  const lessonId = LessonId.parse("12121212-1212-4121-8121-121212121212");

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    celebrate.mockReset();
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

  test("WHEN the lesson is marked complete THEN it is celebrated", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <LessonCompletionToggle
        lessonId={lessonId}
        markComplete={async () => ({ data: { completed: true } })}
        unmarkComplete={async () => ({ data: { unmarked: true } })}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "markComplete" }));

    // Assert
    await screen.findByText("completed");
    expect(celebrate).toHaveBeenCalled();
  });

  test("WHEN the Server Action rejects the input THEN nothing is celebrated", async () => {
    // Arrange — nothing was recorded, so there is nothing to celebrate.
    const user = userEvent.setup();
    render(
      <LessonCompletionToggle
        lessonId={lessonId}
        markComplete={async () => ({})}
        unmarkComplete={async () => ({ data: { unmarked: true } })}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "markComplete" }));

    // Assert
    expect(celebrate).not.toHaveBeenCalled();
  });

  test("WHEN the learner un-marks a lesson THEN nothing is celebrated", async () => {
    // Arrange
    const user = userEvent.setup();
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    render(
      <NiceModal.Provider>
        <LessonCompletionToggle
          lessonId={lessonId}
          markComplete={async () => ({ data: { completed: true } })}
          unmarkComplete={async () => ({ data: { unmarked: true } })}
        />
      </NiceModal.Provider>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "unmark" }));
    await user.click(await screen.findByRole("button", { name: "confirm" }));

    // Assert
    await screen.findByRole("button", { name: "markComplete" });
    expect(celebrate).not.toHaveBeenCalled();
  });
});
