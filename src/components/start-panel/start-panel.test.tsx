import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StartPanel } from "./start-panel";

const firstLessonHref = `/courses/basic-course/modules/1-introduction/lessons/${faker.string.uuid()}`;

describe("StartPanel", () => {
  test("WHEN rendered THEN its one action opens the first lesson", () => {
    renderInLocale(
      <StartPanel
        firstLessonHref={firstLessonHref}
        firstLessonMinutes={8}
        courseTitle="Basic Course"
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Watch the first video");
    expect(links[0]).toHaveAttribute("href", expect.stringContaining(firstLessonHref));
  });

  test("WHEN the first lesson has a runtime THEN the note says how long it is and which course it opens", () => {
    renderInLocale(
      <StartPanel
        firstLessonHref={firstLessonHref}
        firstLessonMinutes={8}
        courseTitle="Basic Course"
      />,
    );

    expect(screen.getByText("Your first video is ready.")).toBeInTheDocument();
    expect(screen.getByText("Basic Course · 8 minutes")).toBeInTheDocument();
  });

  test("WHEN the first lesson has no runtime THEN the note names the course alone", () => {
    renderInLocale(
      <StartPanel
        firstLessonHref={firstLessonHref}
        firstLessonMinutes={null}
        courseTitle="Basic Course"
      />,
    );

    expect(screen.getByText("Basic Course")).toBeInTheDocument();
  });
});
