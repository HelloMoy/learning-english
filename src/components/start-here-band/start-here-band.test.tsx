import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StartHereBand } from "./start-here-band";

const action = <a href="#start-course">Start course</a>;

describe("StartHereBand", () => {
  test("WHEN the first lesson has a runtime THEN the band restates the offer in minutes", () => {
    renderInLocale(
      <StartHereBand
        firstLessonMinutes={8}
        action={action}
      />,
    );

    expect(screen.getByText("Start here")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "8 minutes to find out what your ear has been missing.",
      }),
    ).toBeInTheDocument();
  });

  test("WHEN the first lesson has no runtime THEN the band restates the offer without one", () => {
    renderInLocale(
      <StartHereBand
        firstLessonMinutes={null}
        action={action}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Find out what your ear has been missing." }),
    ).toBeInTheDocument();
  });

  test("WHEN rendered THEN it repeats the action it is given", () => {
    renderInLocale(
      <StartHereBand
        firstLessonMinutes={8}
        action={action}
      />,
    );

    expect(screen.getByRole("link", { name: "Start course" })).toHaveAttribute(
      "href",
      "#start-course",
    );
  });
});
