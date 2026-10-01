import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { aCourseView, asReference, lessonOf } from "@/test-setup/stubs/course-views";

import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useCourseShelf } from "./use-course-shelf";

const basic = aCourseView("basic-course", 1, [1, 3]);
const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);
const courses = [basic, advanced];
const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2]));

describe("useCourseShelf", () => {
  test("WHEN the learner's state is not seeded THEN the shelf is pending", () => {
    const { result } = renderHook(() => useCourseShelf(courses));

    expect(result.current.status).toBe("pending");
  });

  test("WHEN the learner last watched Advanced THEN it leads AND Basic follows", () => {
    givenLearner.enrolledCourses(["basic-course", "advanced-intermediate-course"]);
    givenLearner.continueWatchingByCourse([
      {
        location: ContinueWatchingLocation.parse({
          courseSlug: advanced.course.slug,
          moduleSlug: advanced.modules[1]!.slug,
          lessonId: lessonOf(advanced, 1, 0).id,
        }),
        watchedAt: 2,
      },
    ]);

    const { result } = renderHook(() => useCourseShelf(courses));

    if (result.current.status !== "read") throw new Error("expected a read shelf");
    expect(result.current.featured?.course.slug).toBe("advanced-intermediate-course");
    expect(result.current.otherEnrolled.map((model) => model.course.slug)).toEqual([
      "basic-course",
    ]);
    expect(result.current.enrolledCount).toBe(2);
  });

  test("WHEN the learner is enrolled in nothing THEN the first course is recommended", () => {
    givenLearner.enrolledCourses([]);

    const { result } = renderHook(() => useCourseShelf(courses));

    if (result.current.status !== "read") throw new Error("expected a read shelf");
    expect(result.current.featured).toBeNull();
    expect(result.current.recommended?.course.slug).toBe("basic-course");
    expect(result.current.available.map((view) => view.course.slug)).toEqual([
      "advanced-intermediate-course",
    ]);
  });

  test("WHEN the learner is enrolled only in a reference course THEN it counts as one enrollment", () => {
    givenLearner.enrolledCourses(["atlas-of-american-sounds"]);

    const { result } = renderHook(() => useCourseShelf([...courses, atlas]));

    if (result.current.status !== "read") throw new Error("expected a read shelf");
    expect(result.current.enrolledCount).toBe(1);
  });
});
