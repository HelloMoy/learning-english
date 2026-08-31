import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleOverview } from "./module-overview";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  language: "en",
  lessonCount: 3,
  moduleCount: 1,
});
const mod1 = Module.parse({
  id: "22222222-2222-4222-8222-222222222222",
  courseId: course.id,
  slug: "mod-1",
  title: "Contractions Reductions",
  sequence: 3,
});

const lessonA = Lesson.parse({
  kind: "video",
  id: "33333333-3333-4333-8333-333333333333",
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 1,
  title: "Lesson A",
  description: "A",
  source: "/local-filesystem-lesson/a.mp4",
  durationSeconds: 240,
});
const lessonB = Lesson.parse({
  ...lessonA,
  id: "44444444-4444-4444-8444-444444444444",
  sequence: 2,
  title: "Lesson B",
});
/**
 * The only lesson here carrying artwork. The real course cannot cover the
 * no-poster branch — all 107 seed lessons have one — so `lessonA` above is
 * deliberately left without a poster to exercise the fallback.
 */
const lessonWithPoster = Lesson.parse({
  ...lessonA,
  id: "66666666-6666-4666-8666-666666666666",
  sequence: 4,
  title: "Lesson With Poster",
  poster: "/local-filesystem-lesson/course-1/mod-1/lesson-a/snapshot.jpeg",
});

const readingLesson = Lesson.parse({
  kind: "reading",
  id: "55555555-5555-4555-8555-555555555555",
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 3,
  title: "Reading Lesson",
  body: "Some body text.",
});

describe("ModuleOverview", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () =>
        ((key: string, values?: Record<string, unknown>) =>
          values
            ? `CourseCatalog.moduleOverview.${key}:${JSON.stringify(values)}`
            : `CourseCatalog.moduleOverview.${key}`) as never,
    );
  });

  test("renders one Open link per lesson, in sequence order, with locale-aware hrefs", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );
    const links = screen.getAllByRole("link", { name: /CourseCatalog\.moduleOverview\.open/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/33333333-3333-4333-8333-333333333333",
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/44444444-4444-4444-8444-444444444444",
    );
  });

  test("shows a duration for video lessons and omits it for reading lessons", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, readingLesson]}
      />,
    );
    // Only the video lesson has a duration label.
    expect(screen.getAllByText('CourseCatalog.moduleOverview.duration:{"minutes":4}')).toHaveLength(
      1,
    );
  });

  test("WHEN a lesson has a poster THEN its row renders that artwork", () => {
    // Act
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonWithPoster]}
      />,
    );

    // Assert — queried through the DOM, not getByRole("img"): the thumbnail
    // is hidden from the accessibility tree on purpose (design D1), so the
    // role query cannot reach it.
    const image = container.querySelector("img");
    expect(image).toHaveAttribute(
      "src",
      "/local-filesystem-lesson/course-1/mod-1/lesson-a/snapshot.jpeg",
    );
  });

  test("WHEN a lesson has no poster THEN its row keeps the placeholder tile", () => {
    // Act — lessonA is a video without artwork; readingLesson has no poster
    // field at all, which the discriminated union guarantees.
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, readingLesson]}
      />,
    );

    // Assert — no broken or empty image is rendered for either row.
    expect(container.querySelector("img")).toBeNull();
  });

  test("WHEN a row renders THEN its thumbnail links to the same lesson as its Open action", () => {
    // Act
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonWithPoster]}
      />,
    );

    // Assert — compared against each other rather than against a hardcoded
    // path, so this fails the moment the two destinations diverge.
    const open = screen.getByRole("link", { name: /CourseCatalog\.moduleOverview\.open/ });
    const thumbnail = container.querySelector('a[aria-hidden="true"]');
    expect(thumbnail).toHaveAttribute("href", open.getAttribute("href"));
  });

  test("WHEN a row renders THEN its thumbnail is out of the a11y tree and the tab order", () => {
    // Act
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonWithPoster]}
      />,
    );

    // Assert
    const thumbnail = container.querySelector('a[aria-hidden="true"]');
    expect(thumbnail).toHaveAttribute("tabindex", "-1");
  });

  test("WHEN a module has several lessons THEN each row exposes exactly one link", () => {
    // Act — the regression this guards: a thumbnail link that is announced
    // would double every row's tab stops and read each lesson twice.
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonWithPoster, lessonA, lessonB]}
      />,
    );

    // Assert — three rows, three links: the back link plus one "Open" each.
    expect(
      screen.getAllByRole("link", { name: /CourseCatalog\.moduleOverview\.open/ }),
    ).toHaveLength(3);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  test("back link returns to the course overview", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA]}
      />,
    );
    expect(screen.getByRole("link", { name: "← Course 1" })).toHaveAttribute(
      "href",
      "/courses/course-1",
    );
  });
});

describe("ModuleOverview — completion indicator", () => {
  const STORAGE_KEY_PREFIX = "learning-english:completed:";

  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () =>
        ((key: string, values?: Record<string, unknown>) =>
          values
            ? `CourseCatalog.moduleOverview.${key}:${JSON.stringify(values)}`
            : `CourseCatalog.moduleOverview.${key}`) as never,
    );
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

  test("WHEN a lesson has been completed THEN its video row shows the indicator", () => {
    // Arrange
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonB.id}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    // Act
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );

    // Assert — exactly one mark, on the completed row.
    const marks = container.querySelectorAll('[data-testid="lesson-completion-mark"]');
    expect(marks).toHaveLength(1);
    const rows = container.querySelectorAll("li");
    expect(rows[1]!.querySelector('[data-testid="lesson-completion-mark"]')).not.toBeNull();
  });

  test("WHEN nothing is completed THEN no marker is rendered", () => {
    // Act
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );

    // Assert
    expect(container.querySelectorAll('[data-testid="lesson-completion-mark"]')).toHaveLength(0);
  });

  test("WHEN a row shows the indicator THEN it keeps its eyebrow, title, duration and Open action", () => {
    // Arrange
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonA.id}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    // Act
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA]}
      />,
    );

    // Assert — the indicator supplements the row, it does not displace it.
    expect(screen.getByText("Lesson A")).toBeInTheDocument();
    expect(
      screen.getByText('CourseCatalog.moduleOverview.videoOrdinal:{"number":1}'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('CourseCatalog.moduleOverview.duration:{"minutes":4}'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /CourseCatalog\.moduleOverview\.open/ }),
    ).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/33333333-3333-4333-8333-333333333333",
    );
  });
});
