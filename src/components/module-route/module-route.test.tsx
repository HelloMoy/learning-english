import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import { faker } from "@faker-js/faker";
import { act, render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleRoute } from "./module-route";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const key = (name: string, values?: Record<string, unknown>): string =>
  values ? `${name}:${JSON.stringify(values)}` : name;

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 3,
  moduleCount: 1,
  sequence: 1,
});

const courseModule = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 2,
});

const lessons = Array.from({ length: 3 }, (_, index) =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId: course.id,
    moduleId: courseModule.id,
    sequence: index + 1,
    title: faker.lorem.words(4),
    description: faker.lorem.sentence(),
    source: "/local-filesystem-lesson/lesson.mp4",
    durationSeconds: 600,
  }),
);

const markCompleteInStorage = (lessonId: LessonId): void => {
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
};

const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

const renderRoute = () =>
  render(
    <ModuleRoute
      course={course}
      module={courseModule}
      lessons={lessons}
    />,
  );

beforeEach(() => {
  mockUseTranslations.mockImplementation(() => key as never);
  window.localStorage.clear();
  announceStorageChange();
});

describe("ModuleRoute", () => {
  describe("GIVEN the page is rendered on the server", () => {
    test("WHEN the first frame is produced THEN every step is upcoming and the panel shows no figures", () => {
      markCompleteInStorage(lessons[0]!.id);

      const html = renderToString(
        <ModuleRoute
          course={course}
          module={courseModule}
          lessons={lessons}
        />,
      );

      expect(html.match(/data-state="upcoming"/g)).toHaveLength(3);
      expect(html).not.toContain('data-state="finished"');
      expect(html).not.toContain('data-state="current"');
      expect(html).not.toContain("videosFinished");
    });
  });

  describe("GIVEN the first lesson is finished in the browser", () => {
    test("WHEN the route renders THEN the steps read finished, current, upcoming in order", async () => {
      markCompleteInStorage(lessons[0]!.id);
      announceStorageChange();

      renderRoute();

      // The continue-watching record is read asynchronously, so the steps settle
      // after the first client render.
      await vi.waitFor(() => {
        const steps = within(screen.getByRole("list")).getAllByRole("listitem");
        expect(steps.map((step) => step.firstElementChild?.getAttribute("data-state"))).toEqual([
          "finished",
          "current",
          "upcoming",
        ]);
      });
    });

    test("WHEN the route renders THEN the panel counts one of three videos", async () => {
      markCompleteInStorage(lessons[0]!.id);
      announceStorageChange();

      renderRoute();

      expect(
        await screen.findByText(key("videosFinished", { finished: 1, total: 3 })),
      ).toBeInTheDocument();
    });
  });

  describe("GIVEN a step links to its lesson", () => {
    test("WHEN the route renders THEN each step's action targets that lesson's page", () => {
      renderRoute();

      const firstStep = within(screen.getByRole("list")).getAllByRole("listitem")[0]!;
      expect(within(firstStep).getByRole("link")).toHaveAttribute(
        "href",
        expect.stringContaining(`/modules/${courseModule.slug}/lessons/${lessons[0]!.id}`),
      );
    });
  });
});
