import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView } from "@/test-setup/stubs/course-views";

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseShelfCard } from "./course-shelf-card";

const advanced = aCourseView("advanced-intermediate-course", 2, [4, 13, 6, 1, 6, 10]);

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
});

describe("CourseShelfCard", () => {
  test("WHEN it renders THEN it shows the course's level, title AND size", () => {
    renderInLocale(<CourseShelfCard view={advanced} />);

    const card = screen.getByTestId("course-shelf-card");
    expect(within(card).getByText("Level 2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: advanced.course.title }),
    ).toBeInTheDocument();
    expect(card).toHaveTextContent("6 modules · 40 videos · 6 h 40 min");
  });

  test("WHEN the course has more than four modules THEN four thumbnails show AND the rest are counted", () => {
    renderInLocale(<CourseShelfCard view={advanced} />);

    expect(screen.getAllByTestId("course-shelf-card-module")).toHaveLength(4);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  test("WHEN Preview course is read THEN it opens the overview", () => {
    renderInLocale(<CourseShelfCard view={advanced} />);

    expect(screen.getByRole("link", { name: "Preview course" })).toHaveAttribute(
      "href",
      "/courses/advanced-intermediate-course",
    );
  });

  test("WHEN Enroll is activated THEN the learner is enrolled at once AND it is saved", async () => {
    const user = userEvent.setup();
    renderInLocale(<CourseShelfCard view={advanced} />);

    await user.click(screen.getByRole("button", { name: "Enroll" }));

    expect(learnerStore.getState().enrolledCourses.has("advanced-intermediate-course")).toBe(true);
    expect(enrollInCourseAction).toHaveBeenCalledWith({
      courseSlug: "advanced-intermediate-course",
    });
  });

  test("WHEN rendered in es THEN the actions come from es.json", () => {
    renderInLocale(<CourseShelfCard view={advanced} />, "es");

    expect(screen.getByRole("button", { name: "Inscribirme" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver el curso" })).toBeInTheDocument();
  });
});
