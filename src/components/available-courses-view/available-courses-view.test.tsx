import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AvailableCoursesView } from "./available-courses-view";

const basic = aCourseView("basic-course", 1, [1, 3]);
const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);
const courses = [basic, advanced];

const aPlaceIn = (
  view: typeof basic,
  moduleIndex: number,
  lessonIndex: number,
  watchedAt: number,
) => ({
  location: ContinueWatchingLocation.parse({
    courseSlug: view.course.slug,
    moduleSlug: view.modules[moduleIndex]!.slug,
    lessonId: lessonOf(view, moduleIndex, lessonIndex).id,
  }),
  watchedAt,
});

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
  vi.mocked(enrollInCourseAction).mockResolvedValue({ data: { enrolled: true } } as never);
});

describe("AvailableCoursesView", () => {
  test("WHEN the learner's state is not read yet THEN the heading renders AND the sections wait", () => {
    renderInLocale(<AvailableCoursesView courses={courses} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Available courses" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("available-courses-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("course-cinema-hero")).toBeNull();
  });

  describe("GIVEN a learner enrolled in Basic only", () => {
    beforeEach(() => {
      givenLearner.enrolledCourses(["basic-course"]);
    });

    test("WHEN the page renders THEN the summary counts one enrollment AND Basic leads as your course", () => {
      renderInLocale(<AvailableCoursesView courses={courses} />);

      expect(screen.getByText("2 courses · you’re enrolled in 1")).toBeInTheDocument();
      const hero = screen.getByTestId("course-cinema-hero");
      expect(within(hero).getByText("Your course")).toBeInTheDocument();
      expect(within(hero).getByRole("heading", { name: basic.course.title })).toBeInTheDocument();
    });

    test("WHEN the page renders THEN there is no other-courses section AND Advanced is on the shelf", () => {
      renderInLocale(<AvailableCoursesView courses={courses} />);

      expect(screen.queryByRole("heading", { name: /more course/ })).toBeNull();
      expect(
        screen.getByRole("heading", { level: 2, name: "Keep going after Level 1" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("course-shelf-card")).toHaveTextContent(advanced.course.title);
    });

    test("WHEN Enroll is activated on Advanced THEN it moves to the learner's other courses at once", async () => {
      const user = userEvent.setup();
      renderInLocale(<AvailableCoursesView courses={courses} />);

      await user.click(screen.getByRole("button", { name: "Enroll" }));

      expect(screen.getByRole("heading", { level: 2, name: "1 more course" })).toBeInTheDocument();
      expect(screen.getByTestId("enrolled-course-card")).toHaveTextContent(advanced.course.title);
      expect(screen.queryByTestId("course-shelf-card")).toBeNull();
      expect(screen.getByText(/You’re enrolled in every course/)).toBeInTheDocument();
    });

    test("WHEN the enrollment is refused THEN Advanced returns to the shelf", async () => {
      vi.mocked(enrollInCourseAction).mockResolvedValue({ serverError: "x" } as never);
      const user = userEvent.setup();
      renderInLocale(<AvailableCoursesView courses={courses} />);

      await user.click(screen.getByRole("button", { name: "Enroll" }));

      await waitFor(() => expect(screen.getByTestId("course-shelf-card")).toBeInTheDocument());
    });
  });

  describe("GIVEN a learner enrolled in both who last watched Advanced", () => {
    test("WHEN the page renders THEN Advanced leads as last watched AND Basic is the other course", () => {
      givenLearner.enrolledCourses(["basic-course", "advanced-intermediate-course"]);
      givenLearner.continueWatchingByCourse([
        aPlaceIn(advanced, 1, 0, 2),
        aPlaceIn(basic, 1, 1, 1),
      ]);

      renderInLocale(<AvailableCoursesView courses={courses} />);

      expect(screen.getByText("2 courses · you’re enrolled in all of them")).toBeInTheDocument();
      const hero = screen.getByTestId("course-cinema-hero");
      expect(within(hero).getByText("Last watched")).toBeInTheDocument();
      expect(
        within(hero).getByRole("heading", { name: advanced.course.title }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("enrolled-course-card")).toHaveTextContent(basic.course.title);
      expect(screen.getByText(/You’re enrolled in every course/)).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner enrolled in nothing", () => {
    test("WHEN the page renders THEN Basic is recommended AND the shelf says start here", () => {
      givenLearner.enrolledCourses([]);

      renderInLocale(<AvailableCoursesView courses={courses} />);

      const hero = screen.getByTestId("course-cinema-hero");
      expect(within(hero).getByText("Recommended for you")).toBeInTheDocument();
      expect(within(hero).getByRole("heading", { name: basic.course.title })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Start here" })).toBeInTheDocument();
      expect(screen.getByTestId("course-shelf-card")).toHaveTextContent(advanced.course.title);
    });
  });

  test("WHEN rendered in es THEN the page copy comes from es.json", () => {
    givenLearner.enrolledCourses(["basic-course"]);

    renderInLocale(<AvailableCoursesView courses={courses} />, "es");

    expect(
      screen.getByRole("heading", { level: 1, name: "Cursos disponibles" }),
    ).toBeInTheDocument();
  });
});
