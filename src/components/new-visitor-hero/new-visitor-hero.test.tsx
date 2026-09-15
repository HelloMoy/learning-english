import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { NewVisitorHero } from "./new-visitor-hero";

const renderHero = (locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <NewVisitorHero
      firstCourseTitle="Basic Course"
      firstCourseVideoCount={48}
      action={<a href="#start-course">Start course</a>}
      aside={<div data-testid="hero-aside" />}
    />,
    locale,
  );

describe("NewVisitorHero", () => {
  test("WHEN rendered THEN it names the path from the first sound with the editorial heading", () => {
    renderHero();

    expect(screen.getByText("From the first sound to real English")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Learn American English one sound at a time.",
      }),
    ).toBeInTheDocument();
  });

  test("WHEN rendered THEN the action it is given is its only link", () => {
    renderHero();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Start course");
  });

  test("WHEN rendered THEN the note names the first course and how many videos it holds", () => {
    renderHero();

    expect(screen.getByText("48 videos · Basic Course")).toBeInTheDocument();
  });

  test("WHEN rendered THEN the card slot is placed in the hero", () => {
    renderHero();

    expect(screen.getByTestId("hero-aside")).toBeInTheDocument();
  });

  test("WHEN rendered in pt THEN the note comes from the Portuguese catalogue", () => {
    renderHero("pt");

    expect(screen.getByText("48 vídeos · Basic Course")).toBeInTheDocument();
  });
});
