import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { act, render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleOverview } from "./module-overview";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  // The progress bar formats its percentage through next-intl rather than
  // concatenating a string, so the mock has to answer for the formatter too.
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
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
  sequence: 1,
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

  test("WHEN the header renders THEN it carries no decorative hero tile", () => {
    // Act
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA]}
      />,
    );

    // Assert — the tile showed the uppercased first word of the module title
    // beside a repeat of the ordinal. Read through the DOM rather than a role
    // query: the tile was `aria-hidden`, so getByText could never see it and
    // would pass whether or not it renders. The header's real content stays.
    expect(container.textContent).not.toContain("CONTRACTIONS");
    expect(
      screen.getByRole("heading", { level: 1, name: "Contractions Reductions" }),
    ).toBeVisible();
    expect(
      screen.getByText('CourseCatalog.moduleOverview.moduleLabel:{"number":"03"}', {
        exact: false,
      }),
    ).toBeInTheDocument();
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

  test("WHEN titles share a long prefix THEN each row renders its title in full", () => {
    // Arrange — the real course's largest module is 16 rows all beginning
    // "Exercise N Pronunciation Step By Step Lesson". Truncated to a phone's
    // width they read identically, so the list stops being a way to pick a
    // lesson. Shortening must stay a CSS concern that a wider row undoes —
    // never something the component bakes into the DOM.
    const longFirst = Lesson.parse({
      ...lessonA,
      id: "77777777-7777-4777-8777-777777777777",
      sequence: 1,
      title: "Exercise 1 Pronunciation Step By Step Lesson",
    });
    const longSecond = Lesson.parse({
      ...lessonA,
      id: "88888888-8888-4888-8888-888888888888",
      sequence: 2,
      title: "Exercise 2 Pronunciation Step By Step Lesson",
    });

    // Act
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[longFirst, longSecond]}
      />,
    );

    // Assert — both full titles present, and distinguishable from each other.
    expect(screen.getByText("Exercise 1 Pronunciation Step By Step Lesson")).toBeInTheDocument();
    expect(screen.getByText("Exercise 2 Pronunciation Step By Step Lesson")).toBeInTheDocument();
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

describe("ModuleOverview — watch progress", () => {
  const PLAYBACK_KEY_PREFIX = "learning-english:playback:";

  const announceStorageChange = () => {
    act(() => {
      refreshSavedPlaybackPositions();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
  };

  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () =>
        ((key: string, values?: Record<string, unknown>) =>
          values ? `${key}:${JSON.stringify(values)}` : key) as never,
    );
    window.localStorage.clear();
    announceStorageChange();
  });

  test("WHEN a lesson has been partly watched THEN its row shows how far the learner got", () => {
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${lessonB.id}`, "60");
    announceStorageChange();

    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );

    const rows = container.querySelectorAll("li");
    const bar = rows[1]!.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    // 60 of lessonB's 240 seconds.
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(rows[0]!.querySelector('[role="progressbar"]')).toBeNull();
  });

  test("WHEN a lesson has been watched to its end THEN the row reads full and carries the mark", () => {
    window.localStorage.setItem(
      `${PLAYBACK_KEY_PREFIX}${lessonA.id}`,
      String(finishThresholdSeconds(240)),
    );
    announceStorageChange();

    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );

    const row = container.querySelectorAll("li")[0]!;
    expect(row.querySelector('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "100");
    expect(row.querySelector('[data-testid="lesson-completion-mark"]')).not.toBeNull();
  });

  test("WHEN a lesson has never been opened THEN no bar is drawn at all", () => {
    // An empty bar in the pre-hydration frame would assert the learner has
    // watched nothing, which may well be false.
    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );

    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });

  test("WHEN a reading lesson renders THEN it carries no bar", () => {
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${readingLesson.id}`, "60");
    announceStorageChange();

    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[readingLesson]}
      />,
    );

    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });

  test("WHEN a row shows a bar THEN the Open action is still its only tab stop", () => {
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${lessonA.id}`, "60");
    announceStorageChange();

    const { container } = render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA]}
      />,
    );

    const row = container.querySelectorAll("li")[0]!;
    const tabbable = row.querySelectorAll("a:not([tabindex='-1']), button, [tabindex='0']");
    expect(tabbable).toHaveLength(1);
    expect(row.querySelector('[role="progressbar"]')).not.toHaveAttribute("tabindex");
  });

  test("WHEN a row shows a bar THEN it keeps its eyebrow, title, duration and Open action", () => {
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${lessonA.id}`, "60");
    announceStorageChange();

    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA]}
      />,
    );

    expect(screen.getByText('videoOrdinal:{"number":1}')).toBeInTheDocument();
    expect(screen.getByText("Lesson A")).toBeInTheDocument();
    expect(screen.getByText('duration:{"minutes":4}')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open/ })).toBeInTheDocument();
  });
});
