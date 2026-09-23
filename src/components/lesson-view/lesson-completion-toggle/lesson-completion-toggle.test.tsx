import { LessonCompletionMark } from "@/components/lesson-completion-mark/lesson-completion-mark";
import { LessonId } from "@/domain/entities/ids/ids";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import { learnerStore, seedLearnerStore } from "@/lib/learner-store/learner-store";

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

/**
 * The completion Server Actions the composition root writes through. Each test
 * shapes their answers; the toggle itself never sees them.
 */
const actions = vi.hoisted(() => ({ mark: vi.fn(), unmark: vi.fn() }));

vi.mock("@/app/[locale]/learner-actions", () => ({
  markLessonCompleteAction: (input: unknown) => actions.mark(input),
  unmarkLessonCompleteAction: (input: unknown) => actions.unmark(input),
}));

vi.mock("next-intl", () => ({
  // The outline's watch-progress bar formats its percentage through next-intl
  // rather than concatenating a string, so the mock has to answer for the
  // formatter too.
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Any Tailwind `lg:` (or wider) variant — the control must not switch on one. */
const BREAKPOINT_VARIANT = /\b(?:sm|md|lg|xl|2xl):/;

/**
 * The gate under test, not the hook: a plain RTL `render()` is a client render
 * rather than a hydration pass, so the real `useIsHydrated` returns `true` on
 * its first call and leaves no un-hydrated frame to observe. The hook's own
 * behavior has `use-is-hydrated.test.ts`.
 */
let isHydrated = true;
vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: () => isHydrated,
}));

// Module scope, not inside a describe: this file has several top-level
// describes with their own `beforeEach`, and a reset in one of them would leave
// the others reading whichever value the previous test happened to set.
beforeEach(() => {
  isHydrated = true;
  actions.mark.mockReset().mockResolvedValue({ data: { completed: true } });
  actions.unmark.mockReset().mockResolvedValue({ data: { unmarked: true } });
});

/** The signed-in learner has completed `lessonId`. */
const givenCompleted = (lessonId: LessonId) =>
  seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lessonId] });

/** Whether the learner store holds the mark. */
const isMarked = (lessonId: LessonId) => learnerStore.getState().completed.has(lessonId);

describe("LessonCompletionToggle", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN the lesson is incomplete THEN it invites the learner to finish it", () => {
    // Arrange — the invitation belongs to the control that owns the state,
    // not to the card around it: only one of them knows which state it is in.

    // Act
    render(<LessonCompletionToggle lessonId={LessonId.parse(faker.string.uuid())} />);

    // Assert
    expect(screen.getByText("prompt")).toBeInTheDocument();
  });

  test("WHEN rendered THEN it shows the 'Mark as complete' label", () => {
    // Arrange

    // Act
    render(<LessonCompletionToggle lessonId={LessonId.parse(faker.string.uuid())} />);

    // Assert
    expect(screen.getByRole("button", { name: "markComplete" })).toBeInTheDocument();
  });

  test("WHEN clicked THEN it calls markComplete and swaps to the completed state", async () => {
    // Arrange
    const lessonId = LessonId.parse(faker.string.uuid());
    const markComplete = actions.mark.mockResolvedValue({ data: { completed: true } });
    const user = userEvent.setup();

    // Act
    render(<LessonCompletionToggle lessonId={lessonId} />);
    await user.click(screen.getByRole("button"));

    // Assert
    expect(markComplete).toHaveBeenCalledWith({ lessonId });
    expect(await screen.findByText("completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "markComplete" })).toBeNull();
  });

  test("WHEN rendered THEN the invitation and the full-width button are the same at every width", () => {
    // Arrange — the closing card is the page's only completion control at
    // every width, so nothing in the incomplete state may switch on a
    // breakpoint: the desktop used to collapse this to a lone button.

    // Act
    render(<LessonCompletionToggle lessonId={LessonId.parse(faker.string.uuid())} />);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-full");
    expect(button.className).not.toMatch(BREAKPOINT_VARIANT);
    expect(button.parentElement).toHaveClass("items-stretch");
    expect(button.parentElement?.className).not.toMatch(BREAKPOINT_VARIANT);
    expect(screen.getByText("prompt").className).not.toMatch(BREAKPOINT_VARIANT);
  });

  test("WHEN the lesson is complete THEN it states so once, announced, and disables nothing", async () => {
    // Arrange — the learner complained about reading "completed" twice: in
    // the button and again in the status line below it. It is said once now,
    // and the statement is the live region that announces the change.
    const user = userEvent.setup();

    // Act
    render(<LessonCompletionToggle lessonId={LessonId.parse(faker.string.uuid())} />);
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
  const lessonId = LessonId.parse("77777777-7777-4777-8777-777777777777");

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN the lesson was already completed THEN the button mounts as completed", () => {
    // Arrange — the regression this fixes: the button used to start at
    // useState(false) and forget across reloads.
    givenCompleted(lessonId);

    // Act
    render(<LessonCompletionToggle lessonId={lessonId} />);

    // Assert
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "unmark" })).toBeEnabled();
  });

  test("WHEN clicked THEN the lesson is recorded in the durable browser store", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LessonCompletionToggle lessonId={lessonId} />);

    // Act
    await user.click(screen.getByRole("button"));

    // Assert — the mark is in the learner store every surface reads, and was
    // saved through the completion action.
    expect(isMarked(lessonId)).toBe(true);
  });

  test("WHEN clicked THEN an indicator rendered alongside observes it without a reload", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <>
        <LessonCompletionToggle lessonId={lessonId} />
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
  const lessonId = LessonId.parse("88888888-8888-4888-8888-888888888888");

  const renderCompleted = (
    unmarkComplete: (input: { lessonId: LessonId }) => Promise<{ data?: { unmarked: boolean } }>,
  ) => {
    givenCompleted(lessonId);
    actions.unmark.mockImplementation(unmarkComplete);
    return render(
      <NiceModal.Provider>
        <LessonCompletionToggle lessonId={lessonId} />
      </NiceModal.Provider>,
    );
  };

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
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
    expect(isMarked(lessonId)).toBe(true);
  });
});

describe("LessonCompletionToggle — the outcome of the confirmation", () => {
  const lessonId = LessonId.parse("99999999-9999-4999-8999-999999999999");
  const storedMark = () => isMarked(lessonId);

  const renderCompleted = (
    unmarkComplete: (input: {
      lessonId: LessonId;
    }) => Promise<{ data?: { unmarked: boolean } } | undefined>,
  ) => {
    givenCompleted(lessonId);
    actions.unmark.mockImplementation(unmarkComplete);
    return render(
      <NiceModal.Provider>
        <LessonCompletionToggle lessonId={lessonId} />
      </NiceModal.Provider>,
    );
  };

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
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
    expect(storedMark()).toBe(false);
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
    expect(storedMark()).toBe(true);
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
    expect(storedMark()).toBe(true);
    expect(screen.getByText("completed")).toBeInTheDocument();
  });
});

describe("LessonCompletionToggle — celebrating the finish", () => {
  const lessonId = LessonId.parse("12121212-1212-4121-8121-121212121212");

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    celebrate.mockReset();
  });

  test("WHEN the lesson is marked complete THEN it is celebrated", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LessonCompletionToggle lessonId={lessonId} />);

    // Act
    await user.click(screen.getByRole("button", { name: "markComplete" }));

    // Assert
    await screen.findByText("completed");
    expect(celebrate).toHaveBeenCalled();
  });

  test("WHEN the Server Action rejects the input THEN nothing is celebrated", async () => {
    // Arrange — nothing was recorded, so there is nothing to celebrate.
    actions.mark.mockResolvedValue({});
    const user = userEvent.setup();
    render(<LessonCompletionToggle lessonId={lessonId} />);

    // Act
    await user.click(screen.getByRole("button", { name: "markComplete" }));

    // Assert
    expect(celebrate).not.toHaveBeenCalled();
  });

  test("WHEN the learner un-marks a lesson THEN nothing is celebrated", async () => {
    // Arrange
    const user = userEvent.setup();
    givenCompleted(lessonId);
    render(
      <NiceModal.Provider>
        <LessonCompletionToggle lessonId={lessonId} />
      </NiceModal.Provider>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "unmark" }));
    await user.click(await screen.findByRole("button", { name: "confirm" }));

    // Assert
    await screen.findByRole("button", { name: "markComplete" });
    expect(celebrate).not.toHaveBeenCalled();
  });
  describe("GIVEN completion cannot be known yet", () => {
    const renderToggle = (lessonId = LessonId.parse(faker.string.uuid())) =>
      render(<LessonCompletionToggle lessonId={lessonId} />);

    test("WHEN the control renders before hydration THEN it asserts neither state", () => {
      isHydrated = false;

      renderToggle();

      // Rendering the incomplete state here tells a learner who already finished
      // the lesson something false, in the page's closing call to action.
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByText("invitation")).toBeNull();
      expect(screen.queryByText("completed")).toBeNull();
    });

    test("WHEN the control renders before hydration THEN it reserves the control's space", () => {
      isHydrated = false;

      renderToggle();

      expect(screen.getByTestId("lesson-completion-toggle-skeleton")).toBeInTheDocument();
    });

    test("WHEN the unknown state is shown THEN it is silent and unfocusable", () => {
      isHydrated = false;

      renderToggle();

      const unknown = screen.getByTestId("lesson-completion-toggle-skeleton");
      expect(unknown).toHaveAttribute("aria-hidden", "true");
      expect(unknown.querySelectorAll("button, a, input, [tabindex]")).toHaveLength(0);
    });

    test("WHEN the unknown state is shown THEN it reserves the same shape at every width", () => {
      isHydrated = false;

      renderToggle();

      // The skeleton is sized against the incomplete state, which no longer
      // changes with the viewport — so neither may the skeleton.
      const unknown = screen.getByTestId("lesson-completion-toggle-skeleton");
      expect(unknown.className).not.toMatch(BREAKPOINT_VARIANT);
      for (const bone of unknown.children) {
        expect(bone.className).not.toMatch(BREAKPOINT_VARIANT);
      }
    });

    test("WHEN completion becomes known THEN the reservation gives way to a real state", () => {
      renderToggle();

      expect(screen.queryByTestId("lesson-completion-toggle-skeleton")).toBeNull();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
