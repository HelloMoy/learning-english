import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, asReference, lessonOf } from "@/test-setup/stubs/course-views";

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AvailableCoursesView } from "./available-courses-view";

const basic = aCourseView("basic-course", 1, [1, 3]);
const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);
const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2]));
const courses = [basic, advanced, atlas];

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

const posterTitles = () =>
  screen
    .getAllByTestId("course-poster")
    .map((poster) => within(poster).getByRole("heading", { level: 2 }).textContent);

const posterOf = (title: string) =>
  screen.getAllByTestId("course-poster").find((poster) => poster.textContent?.includes(title))!;

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
  vi.mocked(enrollInCourseAction).mockResolvedValue({ data: { enrolled: true } } as never);
});

describe("AvailableCoursesView", () => {
  test("WHEN the learner's state is not read yet THEN the heading renders AND the posters wait", () => {
    // Act
    renderInLocale(<AvailableCoursesView courses={courses} />);

    // Assert
    expect(
      screen.getByRole("heading", { level: 1, name: "Available courses" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("available-courses-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("course-poster")).toBeNull();
    expect(screen.queryByTestId("next-up-bar")).toBeNull();
  });

  describe("GIVEN a learner enrolled in Basic only", () => {
    beforeEach(() => {
      givenLearner.enrolledCourses(["basic-course"]);
    });

    test("WHEN the page renders THEN the summary counts one enrollment AND every course is a poster, Basic first", () => {
      // Act
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Assert
      expect(screen.getByText("3 courses · you’re enrolled in 1")).toBeInTheDocument();
      expect(posterTitles()).toEqual([
        basic.course.title,
        advanced.course.title,
        atlas.course.title,
      ]);
      expect(within(posterOf(basic.course.title)).getByText("Enrolled")).toBeInTheDocument();
    });

    test("WHEN the page renders THEN there is no next-up bar", () => {
      // Act
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Assert
      expect(screen.queryByTestId("next-up-bar")).toBeNull();
    });

    test("WHEN Enroll is activated on Advanced THEN its poster reads Enrolled at once", async () => {
      // Arrange
      const user = userEvent.setup();
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Act
      await user.click(
        within(posterOf(advanced.course.title)).getByRole("button", { name: "Enroll" }),
      );

      // Assert
      expect(within(posterOf(advanced.course.title)).getByText("Enrolled")).toBeInTheDocument();
      expect(screen.getByText("3 courses · you’re enrolled in 2")).toBeInTheDocument();
    });

    test("WHEN the enrollment is refused THEN Advanced offers Enroll again", async () => {
      // Arrange
      vi.mocked(enrollInCourseAction).mockResolvedValue({ serverError: "x" } as never);
      const user = userEvent.setup();
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Act
      await user.click(
        within(posterOf(advanced.course.title)).getByRole("button", { name: "Enroll" }),
      );

      // Assert
      await waitFor(() =>
        expect(
          within(posterOf(advanced.course.title)).getByRole("button", { name: "Enroll" }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("GIVEN a learner enrolled in Basic and Advanced who last watched Advanced", () => {
    test("WHEN the page renders THEN Advanced leads, Basic follows AND the Atlas closes the lobby", () => {
      // Arrange
      givenLearner.enrolledCourses(["basic-course", "advanced-intermediate-course"]);
      givenLearner.continueWatchingByCourse([
        aPlaceIn(advanced, 1, 0, 2),
        aPlaceIn(basic, 1, 1, 1),
      ]);

      // Act
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Assert
      expect(posterTitles()).toEqual([
        advanced.course.title,
        basic.course.title,
        atlas.course.title,
      ]);
    });
  });

  describe("GIVEN a learner enrolled in every course", () => {
    test("WHEN the page renders THEN the summary says so", () => {
      // Arrange
      givenLearner.enrolledCourses(courses.map((view) => view.course.slug));

      // Act
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Assert
      expect(screen.getByText("3 courses · you’re enrolled in all of them")).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner enrolled in nothing", () => {
    beforeEach(() => {
      givenLearner.enrolledCourses([]);
    });

    test("WHEN the page renders THEN the next-up bar for Basic comes before the heading", () => {
      // Act
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Assert
      const bar = screen.getByTestId("next-up-bar");
      const heading = screen.getByRole("heading", { level: 1, name: "Available courses" });
      expect(bar).toHaveTextContent(`Next up · ${basic.course.title}`);
      expect(bar.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test("WHEN the page renders THEN every course is a joinable poster in catalog order", () => {
      // Act
      renderInLocale(<AvailableCoursesView courses={[atlas, advanced, basic]} />);

      // Assert
      expect(posterTitles()).toEqual([
        basic.course.title,
        advanced.course.title,
        atlas.course.title,
      ]);
      expect(screen.getAllByRole("button", { name: "Enroll" })).toHaveLength(3);
    });

    test("WHEN Enroll is activated on a poster THEN the next-up bar leaves", async () => {
      // Arrange
      const user = userEvent.setup();
      renderInLocale(<AvailableCoursesView courses={courses} />);

      // Act
      await user.click(
        within(posterOf(advanced.course.title)).getByRole("button", { name: "Enroll" }),
      );

      // Assert
      expect(screen.queryByTestId("next-up-bar")).toBeNull();
    });
  });

  test("WHEN rendered in es THEN the page copy comes from es.json", () => {
    // Arrange
    givenLearner.enrolledCourses([]);

    // Act
    renderInLocale(<AvailableCoursesView courses={courses} />, "es");

    // Assert
    expect(
      screen.getByRole("heading", { level: 1, name: "Cursos disponibles" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("next-up-bar")).toHaveTextContent("Lo que sigue · ");
  });
});
