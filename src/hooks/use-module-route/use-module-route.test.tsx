import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LessonId } from "@/domain/entities/ids/ids";
import type { RouteLesson } from "@/lib/module-route/module-route";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { act, renderHook, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test } from "vitest";

import { useModuleRoute } from "./use-module-route";

const LESSON_DURATION_SECONDS = 600;

const makeLessons = (count: number): RouteLesson[] =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    durationSeconds: LESSON_DURATION_SECONDS,
  }));

const markCompleteInStorage = (lessonId: LessonId): void => {
  givenLearner.completed([lessonId]);
};

const storePosition = (lessonId: LessonId, seconds: number): void => {
  givenLearner.positions({ [lessonId]: seconds });
};

const storeLastOpened = (lessonId: LessonId): void => {
  givenLearner.continueWatching(
    ContinueWatchingLocation.parse({
      courseSlug: "basic-course",
      moduleSlug: "2-vowels",
      lessonId,
    }),
  );
};

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

const renderRoute = (lessons: RouteLesson[]) => renderHook(() => useModuleRoute(lessons));

function ReadingProbe({ lessons }: { lessons: RouteLesson[] }) {
  const reading = useModuleRoute(lessons);
  return <output>{reading.isRead ? "read" : "unread"}</output>;
}

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("useModuleRoute — reading", () => {
  describe("GIVEN the page is rendered on the server", () => {
    test("WHEN the hook runs THEN progress is reported as not read yet", () => {
      const lessons = makeLessons(3);
      markCompleteInStorage(lessons[0]!.id);

      const html = renderToString(<ReadingProbe lessons={lessons} />);

      expect(html).toContain("unread");
    });
  });

  describe("GIVEN the hook mounts in the browser", () => {
    test("WHEN the continue-watching record has not been read yet THEN progress is not read yet", () => {
      const lessons = makeLessons(3);

      const { result } = renderRoute(lessons);

      expect(result.current.isRead).toBe(false);
    });

    test("WHEN the record has been read THEN the route is read with the first lesson current", async () => {
      const lessons = makeLessons(3);

      const { result } = renderRoute(lessons);

      await waitFor(() => expect(result.current.isRead).toBe(true));
      if (!result.current.isRead) return;
      expect(result.current.route.steps.map((step) => step.state)).toEqual([
        "current",
        "upcoming",
        "upcoming",
      ]);
    });
  });
});

describe("useModuleRoute — progress", () => {
  describe("GIVEN lessons finished by both completion routes", () => {
    test("WHEN the route is read THEN both count as finished", async () => {
      const lessons = makeLessons(4);
      markCompleteInStorage(lessons[0]!.id);
      storePosition(lessons[1]!.id, LESSON_DURATION_SECONDS);
      announceStorageChange();

      const { result } = renderRoute(lessons);

      await waitFor(() =>
        expect(result.current.isRead && result.current.route.finishedCount).toBe(2),
      );
    });
  });

  describe("GIVEN the route has been read", () => {
    test("WHEN a lesson is completed in storage afterwards THEN the route updates", async () => {
      const lessons = makeLessons(2);
      const { result } = renderRoute(lessons);
      await waitFor(() => expect(result.current.isRead).toBe(true));

      markCompleteInStorage(lessons[0]!.id);
      announceStorageChange();

      await waitFor(() =>
        expect(result.current.isRead && result.current.route.finishedCount).toBe(1),
      );
    });
  });
});

describe("useModuleRoute — last opened lesson", () => {
  describe("GIVEN a later lesson finished and an earlier unfinished lesson opened last", () => {
    test("WHEN the route is read THEN the lesson opened last is current", async () => {
      const lessons = makeLessons(6);
      markCompleteInStorage(lessons[4]!.id);
      storeLastOpened(lessons[0]!.id);
      announceStorageChange();

      const { result } = renderRoute(lessons);

      await waitFor(() =>
        expect(result.current.isRead && result.current.route.steps[0]!.state).toBe("current"),
      );
    });
  });

  describe("GIVEN the record points to a lesson outside this module", () => {
    test("WHEN the route is read THEN the furthest progress decides the current lesson", async () => {
      const lessons = makeLessons(6);
      markCompleteInStorage(lessons[3]!.id);
      storeLastOpened(LessonId.parse(faker.string.uuid()));
      announceStorageChange();

      const { result } = renderRoute(lessons);

      await waitFor(() =>
        expect(result.current.isRead && result.current.route.steps[4]!.state).toBe("current"),
      );
    });
  });
});
