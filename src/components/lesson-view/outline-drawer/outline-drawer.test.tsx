import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { stubElementGeometry, type ElementGeometryStub } from "@/test-setup/stubs/element-geometry";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

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

const renderDrawer = () =>
  render(
    <OutlineDrawer
      course={course}
      modules={[mod]}
      lessonsByModuleId={new Map([[mod.id, [lesson]]])}
      currentLessonId={lesson.id}
    />,
  );

describe("OutlineDrawer", () => {
  let geometry: ElementGeometryStub;

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    geometry = stubElementGeometry();
  });

  afterEach(() => {
    geometry.restore();
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

    // Assert — the desktop sidebar exists with `hidden lg:flex`. Class
    // assertions are stable enough for this layout-only concern.
    const desktopAside = container.querySelector("aside.hidden.lg\\:flex");
    expect(desktopAside).toBeInTheDocument();
    const mobileDetails = container.querySelector("details.lg\\:hidden");
    expect(mobileDetails).toBeInTheDocument();
  });

  test("WHEN rendered THEN the desktop sidebar is sticky and bounded, and scrolls one level in", () => {
    // Act
    const { container } = renderDrawer();

    // Assert — the sidebar sticks below the header and bounds its height,
    // while the scrolling happens in an unpadded region inside it so nothing
    // can scroll through the card's padding above the pinned heading. Class
    // assertions are stable enough for this layout-only concern, as in the
    // test above.
    const desktopAside = container.querySelector("aside");
    expect(desktopAside).toHaveClass("sticky");
    expect(desktopAside?.className).toMatch(/max-h-\[/);
    expect(desktopAside).not.toHaveClass("overflow-y-auto");
    expect(desktopAside?.querySelector(".overflow-y-auto")).toBeInTheDocument();
  });

  test("WHEN rendered THEN the desktop sidebar scrolls the current lesson into its own view", () => {
    // Act
    const { container } = renderDrawer();

    // Assert — exactly one region positions itself on mount, and it is the
    // sidebar's scroll region. The offset itself is jsdom's zero; the
    // arithmetic has its own unit test.
    expect(geometry.scrollTopWrites).toHaveLength(1);
    expect(geometry.scrollTopWrites[0]?.element).toBe(
      container.querySelector("aside .overflow-y-auto"),
    );
  });

  test("WHEN the mobile drawer is opened THEN its outline scrolls the current lesson into view", async () => {
    // Arrange — a closed <details> has no layout to measure, so the drawer
    // must wait for the learner to open it.
    const user = userEvent.setup();
    const { container } = renderDrawer();
    const details = container.querySelector("details");
    const writesBeforeOpening = geometry.scrollTopWrites.length;

    // Act
    await user.click(screen.getAllByText("title")[0] as HTMLElement);

    // Assert
    expect(details?.open).toBe(true);
    const writesWhileOpening = geometry.scrollTopWrites.slice(writesBeforeOpening);
    expect(writesWhileOpening).toHaveLength(1);
    expect(details?.contains(writesWhileOpening[0]?.element ?? null)).toBe(true);
  });
});
