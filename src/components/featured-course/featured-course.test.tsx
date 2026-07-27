import { Course } from "@/domain/entities/course/course";
import { CourseId } from "@/domain/entities/ids/ids";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FeaturedCourse } from "./featured-course";

const course = Course.parse({
  id: CourseId.parse("11111111-1111-4111-8111-111111111111"),
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "Course content generated from local files.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
});

describe("FeaturedCourse", () => {
  test("renders the featured label, title, counts and a locale-aware link", () => {
    render(
      <FeaturedCourse
        course={course}
        href="/courses/advanced-intermediate-course"
        featuredLabel="Courses · Featured"
        featureLabel="Feature"
        featureHeadline="Welcome"
        countsLabel="10 modules · 107 lessons"
      />,
    );
    expect(screen.getByText("Courses · Featured")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Advanced Intermediate Course" }),
    ).toBeInTheDocument();
    expect(screen.getByText("10 modules · 107 lessons")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Advanced Intermediate Course" })).toHaveAttribute(
      "href",
      "/courses/advanced-intermediate-course",
    );
  });

  test("renders one numbered chip per module (01–10)", () => {
    render(
      <FeaturedCourse
        course={course}
        href="/courses/x"
        featuredLabel="Featured"
        featureLabel="Feature"
        featureHeadline="Welcome"
        countsLabel="10 modules · 107 lessons"
      />,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  test("shows the poster image when a URL is provided", () => {
    render(
      <FeaturedCourse
        course={course}
        href="/courses/x"
        posterUrl="/local-filesystem-lesson/snapshot.jpeg"
        featuredLabel="Featured"
        featureLabel="Feature"
        featureHeadline="Welcome"
        countsLabel="counts"
      />,
    );
    expect(screen.getByRole("img", { name: "Advanced Intermediate Course" })).toBeInTheDocument();
  });
});
