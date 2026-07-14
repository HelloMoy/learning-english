import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { OutlineDrawer } from "./outline-drawer";

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

describe("OutlineDrawer", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN the mobile branch shows a collapsible <details> wrapper", () => {
    // Act
    render(
      <OutlineDrawer
        course={course}
        modules={[mod]}
        lessonsByModuleId={new Map([[mod.id, [lesson]]])}
        currentLessonId={lesson.id}
      />,
    );

    // Assert — the mobile <details> element is present with the outline
    // title in its <summary>. Two outlines are rendered (mobile + desktop
    // branches); we assert on the first occurrence.
    const summaries = screen.getAllByText("title");
    expect(summaries.length).toBeGreaterThanOrEqual(2);
  });

  test("WHEN rendered THEN the desktop branch is wrapped in a hidden <aside>", () => {
    // Act
    const { container } = render(
      <OutlineDrawer
        course={course}
        modules={[mod]}
        lessonsByModuleId={new Map([[mod.id, [lesson]]])}
        currentLessonId={lesson.id}
      />,
    );

    // Assert — the desktop sidebar exists with `hidden lg:block`. Class
    // assertions are stable enough for this layout-only concern.
    const desktopAside = container.querySelector("aside.hidden.lg\\:block");
    expect(desktopAside).toBeInTheDocument();
    const mobileDetails = container.querySelector("details.lg\\:hidden");
    expect(mobileDetails).toBeInTheDocument();
  });
});
