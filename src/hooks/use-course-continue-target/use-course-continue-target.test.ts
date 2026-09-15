import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";
import type { ResolvedContinueWatching } from "@/hooks/use-resolved-continue-watching/use-resolved-continue-watching";

import { faker } from "@faker-js/faker";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useCourseContinueTarget, type ContinueCourse } from "./use-course-continue-target";

const COMPLETED_KEY_PREFIX = "learning-english:completed:";

const introduction = {
  id: ModuleId.parse(faker.string.uuid()),
  slug: Slug.parse("1-introduction"),
};
const vowels = { id: ModuleId.parse(faker.string.uuid()), slug: Slug.parse("2-vowels") };

const sliceOf = (moduleId: string) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId: ModuleId.parse(moduleId),
  durationSeconds: 600,
});

const introductionVideo = sliceOf(introduction.id);
const vowelVideos = [sliceOf(vowels.id), sliceOf(vowels.id), sliceOf(vowels.id)];

const course: ContinueCourse = {
  course: { slug: Slug.parse("basic-course") },
  modules: [introduction, vowels],
  lessonRuntimes: [introductionVideo, ...vowelVideos],
};

const panelFor = (lessonId: string, lessonSequence: number): ContinueWatchingPanel => ({
  courseSlug: "basic-course",
  courseTitle: "Basic Course",
  moduleId: vowels.id,
  moduleSequence: 2,
  moduleTitle: "Vowels",
  lessonSequence,
  lessonTitle: faker.lorem.words(3),
  lessonHref: `/courses/basic-course/modules/2-vowels/lessons/${lessonId}`,
  durationSeconds: 600,
});

const recorded = (lessonId: string, lessonSequence = 1): ResolvedContinueWatching => ({
  status: "resolved",
  panel: panelFor(lessonId, lessonSequence),
  lessonId: LessonId.parse(lessonId),
});

/** A resolver that records every location it is asked for and answers with a panel for it. */
const recordingResolver = () => {
  const asked: ContinueWatchingLocation[] = [];
  const resolve = async (location: ContinueWatchingLocation) => {
    asked.push(location);
    return panelFor(location.lessonId, 2);
  };
  return { asked, resolve };
};

const markComplete = (...ids: string[]) => {
  for (const id of ids) window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${id}`, "1");
};

describe("useCourseContinueTarget", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("GIVEN the recorded video is not finished", () => {
    test("WHEN the target is read THEN it is the recorded panel AND nothing more is resolved", async () => {
      // Arrange
      const { asked, resolve } = recordingResolver();
      const lastLesson = recorded(vowelVideos[0]!.id);
      const options = { course, lastLesson, resolve };

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(options));

      // Assert
      await waitFor(() => expect(result.current).toEqual(lastLesson));
      expect(asked).toEqual([]);
    });
  });

  describe("GIVEN the recorded video is finished", () => {
    test("WHEN the target is read THEN the next video's location is resolved AND offered", async () => {
      // Arrange
      markComplete(introductionVideo.id, vowelVideos[0]!.id);
      const { asked, resolve } = recordingResolver();
      const options = { course, lastLesson: recorded(vowelVideos[0]!.id), resolve };

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(options));

      // Assert
      await waitFor(() =>
        expect(result.current).toMatchObject({ status: "resolved", lessonId: vowelVideos[1]!.id }),
      );
      expect(asked).toEqual([
        { courseSlug: "basic-course", moduleSlug: "2-vowels", lessonId: vowelVideos[1]!.id },
      ]);
    });

    test("WHEN the other video's round-trip has not answered THEN the target is still resolving", () => {
      // Arrange
      markComplete(vowelVideos[0]!.id);
      const options = {
        course,
        lastLesson: recorded(vowelVideos[0]!.id),
        resolve: () => new Promise<ContinueWatchingPanel | null>(() => {}),
      };

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(options));

      // Assert
      expect(result.current).toEqual({ status: "resolving" });
    });
  });

  describe("GIVEN every video of the course is finished", () => {
    test("WHEN the target is read THEN the course's first video is resolved to watch again", async () => {
      // Arrange
      markComplete(introductionVideo.id, ...vowelVideos.map((video) => video.id));
      const { asked, resolve } = recordingResolver();
      const options = { course, lastLesson: recorded(vowelVideos[2]!.id, 3), resolve };

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(options));

      // Assert
      await waitFor(() =>
        expect(result.current).toMatchObject({
          status: "resolved",
          lessonId: introductionVideo.id,
        }),
      );
      expect(asked).toEqual([
        {
          courseSlug: "basic-course",
          moduleSlug: "1-introduction",
          lessonId: introductionVideo.id,
        },
      ]);
    });
  });

  describe("GIVEN the record has not resolved", () => {
    test.each([{ status: "none" }, { status: "resolving" }] as const)(
      "WHEN the record is $status THEN the target is $status too",
      (lastLesson) => {
        // Arrange
        const { asked, resolve } = recordingResolver();
        const options = { course, lastLesson, resolve };

        // Act
        const { result } = renderHook(() => useCourseContinueTarget(options));

        // Assert
        expect(result.current).toEqual(lastLesson);
        expect(asked).toEqual([]);
      },
    );
  });
});
