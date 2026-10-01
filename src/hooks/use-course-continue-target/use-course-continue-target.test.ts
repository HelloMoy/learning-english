import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { aCourseView, everyVideoOf, lessonOf } from "@/test-setup/stubs/course-views";

import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useCourseContinueTarget } from "./use-course-continue-target";

// One video in lesson 1, two in lesson 2.
const course = aCourseView("basic-course", 1, [1, 2]);

describe("useCourseContinueTarget", () => {
  describe("GIVEN nothing of the course is watched", () => {
    test("WHEN the hook runs THEN it starts at the course's first video", () => {
      // Arrange
      givenLearner.completed([]);

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(course));

      // Assert
      expect(result.current?.kind).toBe("start");
      expect(result.current?.lesson.id).toBe(lessonOf(course, 0, 0).id);
    });
  });

  describe("GIVEN the recorded video is finished", () => {
    test("WHEN the hook runs THEN it continues with the next unfinished video", () => {
      // Arrange
      const finished = lessonOf(course, 0, 0);
      givenLearner.completed([finished.id]);
      givenLearner.continueWatching(
        ContinueWatchingLocation.parse({
          courseSlug: "basic-course",
          moduleSlug: "module-1",
          lessonId: finished.id,
        }),
      );

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(course));

      // Assert
      expect(result.current?.kind).toBe("continue");
      expect(result.current?.module.slug).toBe("module-2");
      expect(result.current?.lesson.id).toBe(lessonOf(course, 1, 0).id);
    });
  });

  describe("GIVEN every video is watched", () => {
    test("WHEN the hook runs THEN it offers the first video again", () => {
      // Arrange
      givenLearner.completed(everyVideoOf(course));

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(course));

      // Assert
      expect(result.current?.kind).toBe("rewatch");
      expect(result.current?.lesson.id).toBe(lessonOf(course, 0, 0).id);
    });
  });

  describe("GIVEN a course with no videos", () => {
    test("WHEN the hook runs THEN there is nothing to open", () => {
      // Arrange
      const empty = aCourseView("empty-course", 9, []);

      // Act
      const { result } = renderHook(() => useCourseContinueTarget(empty));

      // Assert
      expect(result.current).toBeNull();
    });
  });
});
