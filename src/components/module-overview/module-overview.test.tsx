import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { act, render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleOverview } from "./module-overview";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const key = (name: string, values?: Record<string, unknown>): string =>
  values ? `${name}:${JSON.stringify(values)}` : name;

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
  durationSeconds: 3000,
});
const lessonB = Lesson.parse({
  ...lessonA,
  id: "44444444-4444-4444-8444-444444444444",
  sequence: 2,
  title: "Lesson B",
  durationSeconds: 1500,
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

const renderOverview = (lessons: Lesson[]) =>
  render(
    <ModuleOverview
      course={course}
      module={mod1}
      lessons={lessons}
    />,
  );

beforeEach(() => {
  mockUseTranslations.mockImplementation(() => key as never);
  window.localStorage.clear();
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
});

describe("ModuleOverview — header", () => {
  describe("GIVEN a module in a course", () => {
    test("WHEN it renders THEN the eyebrow names the lesson ordinal and the course", () => {
      renderOverview([lessonA]);

      expect(
        screen.getByText(key("moduleEyebrow", { number: "03", courseTitle: "Course 1" })),
      ).toBeInTheDocument();
    });

    test("WHEN it renders THEN the module title is the page heading", () => {
      renderOverview([lessonA]);

      expect(
        screen.getByRole("heading", { level: 1, name: "Contractions Reductions" }),
      ).toBeVisible();
    });

    test("WHEN it renders THEN the back link returns to the course overview", () => {
      renderOverview([lessonA]);

      expect(screen.getByRole("link", { name: "← Course 1" })).toHaveAttribute(
        "href",
        "/courses/course-1",
      );
    });

    test("WHEN it renders THEN it carries no decorative hero tile", () => {
      const { container } = renderOverview([lessonA]);

      expect(container.textContent).not.toContain("CONTRACTIONS");
    });
  });

  describe("GIVEN two videos of 50 and 25 minutes and a reading lesson", () => {
    test("WHEN it renders THEN the stats line counts three lessons and 1 h 15 min, ignoring the reading lesson's runtime", () => {
      renderOverview([lessonA, lessonB, readingLesson]);

      expect(
        screen.getByText(
          key("stats", { count: 3, runtime: key("runtime", { hours: 1, minutes: 15 }) }),
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("ModuleOverview — route", () => {
  describe("GIVEN a module with lessons", () => {
    test("WHEN it renders THEN the route lists one step per lesson in sequence order", () => {
      renderOverview([lessonA, lessonB, readingLesson]);

      const steps = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(steps).toHaveLength(3);
      expect(within(steps[0]!).getByText("Lesson A")).toBeInTheDocument();
      expect(within(steps[2]!).getByText("Reading Lesson")).toBeInTheDocument();
    });

    test("WHEN it renders THEN the progress panel is present", () => {
      renderOverview([lessonA, lessonB]);

      expect(screen.getByText("progressHeading")).toBeInTheDocument();
    });

    test("WHEN it renders THEN the retired per-row completion mark is gone", () => {
      givenLearner.completed([lessonA.id]);

      const { container } = renderOverview([lessonA, lessonB]);

      expect(container.querySelector('[data-testid="lesson-completion-mark"]')).toBeNull();
    });
  });

  describe("GIVEN lesson titles sharing a long prefix", () => {
    test("WHEN it renders THEN each step shows its title in full", () => {
      const longFirst = Lesson.parse({
        ...lessonA,
        title: "Exercise 1 Pronunciation Step By Step Lesson",
      });
      const longSecond = Lesson.parse({
        ...lessonB,
        title: "Exercise 2 Pronunciation Step By Step Lesson",
      });

      renderOverview([longFirst, longSecond]);

      expect(screen.getByText("Exercise 1 Pronunciation Step By Step Lesson")).toBeInTheDocument();
      expect(screen.getByText("Exercise 2 Pronunciation Step By Step Lesson")).toBeInTheDocument();
    });
  });
});

describe("ModuleOverview — the next lesson", () => {
  const nextModule = Module.parse({
    id: "66666666-6666-4666-8666-666666666666",
    courseId: course.id,
    slug: "mod-2",
    title: "Next Lesson",
    sequence: 4,
  });
  const onlyVideo = Lesson.parse({
    ...lessonA,
    id: "77777777-7777-4777-8777-777777777777",
    moduleId: nextModule.id,
  });

  const completeEveryLesson = (lessons: Lesson[]) => {
    for (const lesson of lessons) {
      givenLearner.completed([lesson.id]);
    }
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
  };

  test("WHEN every ticket is in and a next lesson holds one video THEN the finale starts that video", async () => {
    completeEveryLesson([lessonA, lessonB]);

    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
        nextModule={{ module: nextModule, lessons: [onlyVideo] }}
      />,
    );

    const start = await screen.findByRole("link", {
      name: key("startNextLesson", { number: "04" }),
    });
    expect(start).toHaveAttribute(
      "href",
      `/courses/course-1/modules/mod-2/lessons/${onlyVideo.id}`,
    );
  });

  test("WHEN there is no next lesson THEN the finale offers none", async () => {
    completeEveryLesson([lessonA, lessonB]);

    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );

    await screen.findByTestId("module-prize-finale");
    expect(screen.queryByText(/^startNextLesson/)).not.toBeInTheDocument();
  });
});
