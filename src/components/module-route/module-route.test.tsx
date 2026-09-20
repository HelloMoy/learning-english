import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

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
  givenLearner.completed([lessonId]);
};

const announceStorageChange = (): void => {
  act(() => {
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

  describe("GIVEN the module's prize", () => {
    const claimInStorage = (): void => {
      givenLearner.claimedPrizes([courseModule.slug]);
    };
    const ticketTag = (earned: number) => key("tag", { earned, count: lessons.length });
    const claimLinks = () =>
      screen.queryAllByRole("link", { name: key("claimLabel", { module: "Vowels" }) });

    test("WHEN the first frame is produced on the server THEN no prize state, tag or claim link is asserted", () => {
      lessons.forEach((lesson) => markCompleteInStorage(lesson.id));

      const html = renderToString(
        <ModuleRoute
          course={course}
          module={courseModule}
          lessons={lessons}
        />,
      );

      expect(html).toContain("hiddenName");
      expect(html).not.toContain("tag:");
      expect(html).not.toContain("claimLabel");
      expect(html).not.toContain('data-testid="module-prize-finale"');
    });

    test("WHEN one ticket is earned THEN the panel and the route's finale both show the hidden prize with one of three tickets", async () => {
      markCompleteInStorage(lessons[0]!.id);
      announceStorageChange();

      renderRoute();

      await vi.waitFor(() => expect(screen.getAllByText(ticketTag(1))).toHaveLength(2));
      const panel = screen.getByRole("region", { name: "progressHeading" });
      expect(within(panel).getByText(ticketTag(1))).toBeInTheDocument();
      expect(screen.getByTestId("module-prize-finale")).toContainElement(
        screen.getAllByText(ticketTag(1))[1]!,
      );
      expect(screen.queryByText("harmonica")).not.toBeInTheDocument();
    });

    test("WHEN the finale renders THEN it follows the list, which keeps one item per lesson", async () => {
      renderRoute();

      const finale = await screen.findByTestId("module-prize-finale");
      const list = screen.getByRole("list");
      expect(within(list).getAllByRole("listitem")).toHaveLength(lessons.length);
      expect(list).not.toContainElement(finale);
      expect(list.compareDocumentPosition(finale)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    test("WHEN every ticket is earned THEN both surfaces send the learner to claim the prize on the counter", async () => {
      lessons.forEach((lesson) => markCompleteInStorage(lesson.id));
      announceStorageChange();

      renderRoute();

      await vi.waitFor(() => expect(claimLinks()).toHaveLength(2));
      for (const link of claimLinks()) {
        expect(link).toHaveAttribute("href", `/achievements?claim=${courseModule.slug}`);
      }
    });

    test("WHEN the prize was claimed THEN both surfaces name it and offer nothing to claim", async () => {
      lessons.forEach((lesson) => markCompleteInStorage(lesson.id));
      claimInStorage();
      announceStorageChange();

      renderRoute();

      await vi.waitFor(() => expect(screen.getAllByText("harmonica")).toHaveLength(2));
      expect(claimLinks()).toHaveLength(0);
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
