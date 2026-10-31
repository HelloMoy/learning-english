import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import type { WatchTally } from "@/hooks/use-course-watch-progress/use-course-watch-progress";

import { faker } from "@faker-js/faker";
import { render as renderUnwrapped, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";

import messages from "../../../messages/en.json";
import { ModuleList } from "./module-list";

/**
 * The real messages, not a mock that echoes keys: each row states an ICU
 * reading with interpolated counts, and asserting on a key would prove only
 * that it reached the formatter.
 */
const render = (ui: ReactElement) =>
  renderUnwrapped(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      {ui}
    </NextIntlClientProvider>,
  );

/** No reading yet — the frame before hydration, and a learner with none. */
const noProgress: ReadonlyMap<string, WatchTally> = new Map();

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "course",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 1,
  moduleCount: 1,
  track: "level",
  sequence: 1,
});
const modA = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-a",
  title: "Module A",
  sequence: 1,
});
const modB = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-b",
  title: "Module B",
  sequence: 2,
});
const modC = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-c",
  title: "Module C",
  sequence: 3,
});

function readingLesson(module: Module, title: string): Lesson {
  return Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId: module.id,
    sequence: 1,
    title,
    body: "body",
  });
}

const lessonA = readingLesson(modA, "Lesson A");
const lessonB = readingLesson(modB, "Lesson B");
const lessonC = readingLesson(modC, "Lesson C");

const threeModules = [modA, modB, modC];
const threeModuleLessons = new Map<string, Lesson[]>([
  [modA.id, [lessonA]],
  [modB.id, [lessonB]],
  [modC.id, [lessonC]],
]);

/**
 * Renders the three-module fixture with the current lesson in module A.
 *
 * @param progressByModuleId - The per-module tallies the outline would hand down
 */
function renderThreeModules(progressByModuleId: ReadonlyMap<string, WatchTally> = noProgress) {
  return render(
    <ModuleList
      course={course}
      modules={threeModules}
      lessonsByModuleId={threeModuleLessons}
      currentLessonId={lessonA.id}
      progressByModuleId={progressByModuleId}
    />,
  );
}

describe("ModuleList", () => {
  test("WHEN rendered with one module THEN it shows the module heading and its lesson", () => {
    // Arrange
    const map = new Map<string, Lesson[]>([[modA.id, [lessonA]]]);

    // Act
    render(
      <ModuleList
        course={course}
        modules={[modA]}
        lessonsByModuleId={map}
        currentLessonId={lessonA.id}
        progressByModuleId={noProgress}
      />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Module A" })).toBeInTheDocument();
    expect(screen.getByText("Lesson A")).toBeInTheDocument();
  });

  test("WHEN rendered THEN the module title is a button, never a link to the module overview", () => {
    // Arrange
    const map = new Map<string, Lesson[]>([[modA.id, [lessonA]]]);

    // Act
    render(
      <ModuleList
        course={course}
        modules={[modA]}
        lessonsByModuleId={map}
        currentLessonId={lessonA.id}
        progressByModuleId={noProgress}
      />,
    );

    // Assert — only the lesson row is a link; the module title is not.
    expect(screen.queryByRole("link", { name: "Module A" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Module A" })).toHaveAttribute("type", "button");
  });

  test("WHEN mounted THEN the current lesson's module is expanded and the others are collapsed", () => {
    // Act
    renderThreeModules();

    // Assert — module A owns the current lesson, so it alone starts open.
    expect(screen.getByRole("button", { name: "Module A" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Lesson A")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Module B" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Lesson B")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Module C" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Lesson C")).not.toBeInTheDocument();
  });

  test("WHEN a collapsed module's title is clicked THEN its lessons appear", async () => {
    // Arrange
    const user = userEvent.setup();
    renderThreeModules();

    // Act
    await user.click(screen.getByRole("button", { name: "Module B" }));

    // Assert
    expect(screen.getByText("Lesson B")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Module B" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("WHEN a second module is expanded THEN the first one stays open", async () => {
    // Arrange
    const user = userEvent.setup();
    renderThreeModules();

    // Act — module A is already open; open B, then C.
    await user.click(screen.getByRole("button", { name: "Module B" }));
    await user.click(screen.getByRole("button", { name: "Module C" }));

    // Assert — all three are open at once; expanding one closes nothing.
    expect(screen.getByText("Lesson A")).toBeInTheDocument();
    expect(screen.getByText("Lesson B")).toBeInTheDocument();
    expect(screen.getByText("Lesson C")).toBeInTheDocument();
  });

  test("WHEN an expanded module's title is clicked THEN it collapses again", async () => {
    // Arrange
    const user = userEvent.setup();
    renderThreeModules();

    // Act — module A starts expanded.
    await user.click(screen.getByRole("button", { name: "Module A" }));

    // Assert
    expect(screen.queryByText("Lesson A")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Module A" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("WHEN a module renders THEN its ring and chevron are decorative and stay out of the accessible name", () => {
    // Act
    renderThreeModules();

    // Assert — the drawings are hidden from assistive tech, so the button's
    // accessible name is exactly the module title.
    const toggle = screen.getByRole("button", { name: "Module A" });
    expect(toggle).toHaveAccessibleName("Module A");
    for (const icon of toggle.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("WHEN a module's lessons are scrolled THEN its title stays pinned below the outline heading", () => {
    // Act
    renderThreeModules();

    // Assert — the outline is a bounded scroll region, so a long module's
    // lessons would otherwise carry their own module title out of sight.
    // The offset comes from the heading that sits above it. The opaque
    // background keeps lesson rows passing behind the title, not through
    // it. Class assertions, as elsewhere for layout-only concerns.
    const toggle = screen.getByRole("button", { name: "Module A" });
    expect(toggle).toHaveClass("sticky");
    expect(toggle).toHaveClass("bg-card");
    expect(toggle.className).toMatch(/top-\[var\(--outline-heading-offset/);
  });

  test("WHEN the module title is reached by keyboard THEN Enter and Space toggle it", async () => {
    // Arrange
    const user = userEvent.setup();
    renderThreeModules();

    // Act — tab to the first module title.
    await user.tab();

    // Assert — the disclosure is tab-reachable, not a div with a click handler.
    expect(screen.getByRole("button", { name: "Module A" })).toHaveFocus();

    // Act + Assert — Enter collapses the focused module...
    await user.keyboard("{Enter}");
    expect(screen.queryByText("Lesson A")).not.toBeInTheDocument();

    // ...and Space expands it again.
    await user.keyboard(" ");
    expect(screen.getByText("Lesson A")).toBeInTheDocument();
  });

  describe("GIVEN the per-module progress", () => {
    test("WHEN part of a module is done THEN its row states the share and its ring is filled", () => {
      // Act
      renderThreeModules(new Map([[modA.id, { completedCount: 4, lessonCount: 6 }]]));

      // Assert
      const toggle = screen.getByRole("button", { name: "Module A" });
      expect(toggle).toHaveAccessibleDescription("4 / 6 videos · 67%");
      expect(within(toggle).getByTestId("completion-ring-fill")).toBeInTheDocument();
    });

    test("WHEN every video of a module is done THEN its row says the lesson is completed", () => {
      // Act
      renderThreeModules(new Map([[modB.id, { completedCount: 6, lessonCount: 6 }]]));

      // Assert — the finished state is a disc with a check, not a full ring.
      const toggle = screen.getByRole("button", { name: "Module B" });
      expect(toggle).toHaveAccessibleDescription("Lesson completed");
      expect(within(toggle).getByTestId("module-completed-mark")).toBeInTheDocument();
      expect(within(toggle).queryByTestId("completion-ring-track")).toBeNull();
    });

    test("WHEN nothing in a module is done THEN its row states its size and its ring is empty", () => {
      // Act
      renderThreeModules(new Map([[modC.id, { completedCount: 0, lessonCount: 6 }]]));

      // Assert
      const toggle = screen.getByRole("button", { name: "Module C" });
      expect(toggle).toHaveAccessibleDescription("6 videos");
      expect(within(toggle).getByTestId("completion-ring-track")).toBeInTheDocument();
      expect(within(toggle).queryByTestId("completion-ring-fill")).toBeNull();
    });

    test("WHEN there is no reading for a module THEN its row counts the videos it holds", () => {
      // Act — the frame before hydration hands down no tallies at all.
      renderThreeModules();

      // Assert — the count comes from the course structure, never from storage.
      const toggle = screen.getByRole("button", { name: "Module A" });
      expect(toggle).toHaveAccessibleDescription("1 video");
      expect(within(toggle).queryByTestId("completion-ring-fill")).toBeNull();
    });
  });
});
