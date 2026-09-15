import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleRouteStep } from "./module-route-step";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const key = (name: string, values?: Record<string, unknown>): string =>
  values ? `${name}:${JSON.stringify(values)}` : name;

const videoLesson = (overrides: Partial<Lesson> = {}): Lesson =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId: CourseId.parse(faker.string.uuid()),
    moduleId: ModuleId.parse(faker.string.uuid()),
    sequence: 7,
    title: faker.lorem.words(4),
    description: faker.lorem.sentence(),
    source: "/local-filesystem-lesson/lesson.mp4",
    durationSeconds: 420,
    ...overrides,
  });

const HREF = "/courses/basic-course/modules/2-vowels/lessons/abc";

beforeEach(() => {
  mockUseTranslations.mockImplementation(() => key as never);
});

describe("ModuleRouteStep — upcoming", () => {
  describe("GIVEN a video lesson with a poster", () => {
    test("WHEN it renders THEN it shows the ordinal and minutes, the title, and the poster", () => {
      const lesson = videoLesson({ poster: "/local-filesystem-lesson/poster.jpeg" });

      const { container } = render(
        <ModuleRouteStep
          lesson={lesson}
          href={HREF}
          state="upcoming"
          watchedFraction={0}
        />,
      );

      expect(
        screen.getByText(
          `${key("videoOrdinal", { number: 7 })} · ${key("duration", { minutes: 7 })}`,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
      expect(
        container.querySelector('img[src="/local-filesystem-lesson/poster.jpeg"]'),
      ).not.toBeNull();
    });

    test("WHEN it renders THEN its single announced link invites watching the video", () => {
      render(
        <ModuleRouteStep
          lesson={videoLesson({ poster: "/local-filesystem-lesson/poster.jpeg" })}
          href={HREF}
          state="upcoming"
          watchedFraction={0}
        />,
      );

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName("watchVideo");
      expect(links[0]).toHaveAttribute("href", expect.stringContaining(HREF));
    });
  });

  describe("GIVEN a video lesson without a poster", () => {
    test("WHEN it renders THEN the gradient fallback shows and no image is rendered", () => {
      const { container } = render(
        <ModuleRouteStep
          lesson={videoLesson()}
          href={HREF}
          state="upcoming"
          watchedFraction={0}
        />,
      );

      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector('[data-testid="route-thumbnail-fallback"]')).not.toBeNull();
    });
  });
});

describe("ModuleRouteStep — finished", () => {
  const renderFinished = (lesson: Lesson) =>
    render(
      <ModuleRouteStep
        lesson={lesson}
        href={HREF}
        state="finished"
        watchedFraction={1}
      />,
    );

  describe("GIVEN a finished lesson with a poster", () => {
    test("WHEN it renders THEN it recedes: no thumbnail, only its ordinal, minutes and title", () => {
      const lesson = videoLesson({ poster: "/local-filesystem-lesson/poster.jpeg" });

      const { container } = renderFinished(lesson);

      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector('[data-testid="route-thumbnail-fallback"]')).toBeNull();
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
      expect(container.firstElementChild).toHaveAttribute("data-state", "finished");
    });

    test("WHEN it renders THEN its single link offers to watch the video again", () => {
      renderFinished(videoLesson());

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName("watchAgain");
      expect(links[0]).toHaveAttribute("href", expect.stringContaining(HREF));
    });

    test("WHEN a screen reader reaches it THEN the finished state is announced by name", () => {
      renderFinished(videoLesson());

      expect(screen.getByText("completed")).toBeInTheDocument();
    });
  });
});

describe("ModuleRouteStep — current", () => {
  const CURRENT_DURATION_SECONDS = 660;

  const renderCurrent = (watchedFraction: number) =>
    render(
      <ModuleRouteStep
        lesson={videoLesson({
          durationSeconds: CURRENT_DURATION_SECONDS,
          poster: "/local-filesystem-lesson/poster.jpeg",
        })}
        href={HREF}
        state="current"
        watchedFraction={watchedFraction}
      />,
    );

  describe("GIVEN the current lesson is watched to 40%", () => {
    test("WHEN it renders THEN it is featured with you-are-here, a 40% bar and 7 minutes left", () => {
      const { container } = renderCurrent(0.4);

      expect(container.firstElementChild).toHaveAttribute("data-state", "current");
      expect(screen.getByText(key("youAreHere", { number: 7 }))).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
      expect(screen.getByText(key("minutesLeft", { minutes: 7 }))).toBeInTheDocument();
      expect(
        container.querySelector('img[src="/local-filesystem-lesson/poster.jpeg"]'),
      ).not.toBeNull();
    });

    test("WHEN it renders THEN its single link offers to continue", () => {
      renderCurrent(0.4);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName("continue");
      expect(links[0]).toHaveAttribute("href", expect.stringContaining(HREF));
    });
  });

  describe("GIVEN the current lesson has not been started", () => {
    test("WHEN it renders THEN it shows no bar and its single link offers to start", () => {
      renderCurrent(0);

      expect(screen.queryByRole("progressbar")).toBeNull();
      expect(screen.queryByText(/^minutesLeft/)).toBeNull();
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName("start");
    });
  });
});

describe("ModuleRouteStep — rail", () => {
  const renderState = (state: "finished" | "current" | "upcoming") =>
    render(
      <ModuleRouteStep
        lesson={videoLesson()}
        href={HREF}
        state={state}
        watchedFraction={state === "finished" ? 1 : 0}
      />,
    );

  describe.each(["finished", "current", "upcoming"] as const)("GIVEN a %s step", (state) => {
    test("WHEN it renders THEN the rail marker shows that state and stays out of the accessibility tree", () => {
      const { container } = renderState(state);

      const marker = container.querySelector('[data-testid="route-marker"]');
      expect(marker).toHaveAttribute("data-marker", state);
      expect(marker).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("GIVEN a finished step", () => {
    test("WHEN it renders THEN the connector below its marker is filled", () => {
      const { container } = renderState("finished");

      expect(container.querySelector('[data-testid="route-connector"]')).toHaveAttribute(
        "data-filled",
        "true",
      );
    });
  });

  describe.each(["current", "upcoming"] as const)("GIVEN a %s step", (state) => {
    test("WHEN it renders THEN the connector below its marker is not filled", () => {
      const { container } = renderState(state);

      expect(container.querySelector('[data-testid="route-connector"]')).toHaveAttribute(
        "data-filled",
        "false",
      );
    });
  });
});

describe("ModuleRouteStep — reading lesson", () => {
  describe("GIVEN a reading lesson, which has no runtime", () => {
    test("WHEN its step renders THEN the eyebrow names the video and omits the minute label", () => {
      const reading = Lesson.parse({
        kind: "reading",
        id: LessonId.parse(faker.string.uuid()),
        courseId: CourseId.parse(faker.string.uuid()),
        moduleId: ModuleId.parse(faker.string.uuid()),
        sequence: 3,
        title: faker.lorem.words(3),
        body: faker.lorem.paragraph(),
      });

      render(
        <ModuleRouteStep
          lesson={reading}
          href={HREF}
          state="upcoming"
          watchedFraction={0}
        />,
      );

      expect(screen.getByText(key("videoOrdinal", { number: 3 }))).toBeInTheDocument();
      expect(screen.queryByText(/duration/)).toBeNull();
    });
  });
});
