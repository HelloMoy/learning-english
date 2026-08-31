import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { Outline } from "./outline";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "course",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 1,
  moduleCount: 1,
  sequence: 1,
});
const mod = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module",
  title: "Module",
  sequence: 1,
});
const lesson = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: mod.id,
  sequence: 1,
  title: "Lesson",
  body: "body",
});

describe("Outline", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it shows the outline heading and the module's lesson", () => {
    // Act
    render(
      <Outline
        course={course}
        modules={[mod]}
        lessonsByModuleId={new Map([[mod.id, [lesson]]])}
        currentLessonId={lesson.id}
      />,
    );

    // Assert
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("Module")).toBeInTheDocument();
    expect(screen.getByText("Lesson")).toBeInTheDocument();
  });

  test("WHEN the outline is scrolled THEN its heading stays pinned to the top of the region", () => {
    // Act
    render(
      <Outline
        course={course}
        modules={[mod]}
        lessonsByModuleId={new Map([[mod.id, [lesson]]])}
        currentLessonId={lesson.id}
      />,
    );

    // Assert — the shell bounds the outline and scrolls it to the current
    // lesson, which would carry the heading out of sight. Pinning it keeps
    // the sidebar labelled; the opaque background stops rows showing
    // through. Class assertions, as elsewhere for layout-only concerns.
    const heading = screen.getByRole("heading", { name: "title" });
    expect(heading).toHaveClass("sticky");
    expect(heading).toHaveClass("top-0");
    expect(heading).toHaveClass("bg-card");
  });

  test("WHEN the shell already names the region THEN the outline renders no second heading", () => {
    // Act — `showHeading={false}` is how a shell whose own control already
    // says "Course outline" (the mobile drawer's <summary>) avoids showing
    // the same words twice.
    render(
      <Outline
        course={course}
        modules={[mod]}
        lessonsByModuleId={new Map([[mod.id, [lesson]]])}
        currentLessonId={lesson.id}
        showHeading={false}
      />,
    );

    // Assert — the visible heading is gone, but the region keeps its
    // accessible name, so assistive technology loses nothing.
    expect(screen.queryByRole("heading", { name: "title" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "title" })).toBeInTheDocument();
  });
});
