import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  enrolledCoursesServerSnapshot,
  enrollInCourse,
  useEnrolledCourses,
} from "./use-enrolled-courses";

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
  vi.mocked(enrollInCourseAction).mockResolvedValue({ data: { enrolled: true } } as never);
});

describe("useEnrolledCourses", () => {
  test("WHEN the learner never enrolled THEN no course reads as enrolled", () => {
    const { result } = renderHook(() => useEnrolledCourses());

    expect(result.current.size).toBe(0);
  });

  test("WHEN the learner's snapshot carries an enrollment THEN it is read", () => {
    givenLearner.enrolledCourses(["basic-course"]);

    const { result } = renderHook(() => useEnrolledCourses());

    expect(result.current.has("basic-course")).toBe(true);
  });

  test("WHEN the learner enrolls THEN the course shows at once AND it is saved for the learner", () => {
    const { result } = renderHook(() => useEnrolledCourses());

    act(() => enrollInCourse("advanced-intermediate-course"));

    expect(result.current.has("advanced-intermediate-course")).toBe(true);
    expect(enrollInCourseAction).toHaveBeenCalledWith({
      courseSlug: "advanced-intermediate-course",
    });
  });

  test("WHEN the learner is already enrolled THEN nothing is sent and readers are not notified", () => {
    givenLearner.enrolledCourses(["basic-course"]);
    const { result } = renderHook(() => useEnrolledCourses());
    const before = result.current;

    act(() => enrollInCourse("basic-course"));

    expect(result.current).toBe(before);
    expect(enrollInCourseAction).not.toHaveBeenCalled();
  });

  test("WHEN the server refuses THEN the course is withdrawn", async () => {
    vi.mocked(enrollInCourseAction).mockResolvedValue({ serverError: "x" } as never);

    act(() => enrollInCourse("advanced-intermediate-course"));

    await waitFor(() =>
      expect(learnerStore.getState().enrolledCourses.has("advanced-intermediate-course")).toBe(
        false,
      ),
    );
  });

  test("WHEN the course is not served THEN the course is withdrawn", async () => {
    vi.mocked(enrollInCourseAction).mockResolvedValue({ data: { enrolled: false } } as never);

    act(() => enrollInCourse("hidden-draft-course"));

    await waitFor(() =>
      expect(learnerStore.getState().enrolledCourses.has("hidden-draft-course")).toBe(false),
    );
  });

  test("WHEN rendering on the server THEN the snapshot is empty and stable", () => {
    expect(enrolledCoursesServerSnapshot().size).toBe(0);
    expect(enrolledCoursesServerSnapshot()).toBe(enrolledCoursesServerSnapshot());
  });
});
