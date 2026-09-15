import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ResumePanel } from "./resume-panel";

const panel: ContinueWatchingPanel = {
  courseSlug: "basic-course",
  courseTitle: "Basic Course",
  moduleId: faker.string.uuid(),
  moduleSequence: 2,
  moduleTitle: "Vowels",
  lessonSequence: 6,
  lessonTitle: "The Vowel Sound Ae",
  lessonHref: `/courses/basic-course/modules/2-vowels/lessons/${faker.string.uuid()}`,
  durationSeconds: 480,
};

const courseHref = "/courses/basic-course";

const renderPanel = (watchedFraction: number | null = 0.4, locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <ResumePanel
      panel={panel}
      moduleLessonCount={17}
      watchedFraction={watchedFraction}
      courseHref={courseHref}
    />,
    locale,
  );

describe("ResumePanel", () => {
  test("WHEN rendered THEN it names the lesson and where it sits in its module", () => {
    renderPanel();

    expect(
      screen.getByText("Basic Course · Lesson 2 · Vowels · Video 6 of 17"),
    ).toBeInTheDocument();
    expect(screen.getByText("The Vowel Sound Ae")).toBeInTheDocument();
  });

  test("WHEN rendered THEN Resume returns to the lesson and a quieter link opens the course", () => {
    renderPanel();

    expect(screen.getByRole("link", { name: "Resume" })).toHaveAttribute(
      "href",
      expect.stringContaining(panel.lessonHref),
    );
    expect(screen.getByRole("link", { name: "View course content" })).toHaveAttribute(
      "href",
      expect.stringContaining(courseHref),
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  test("WHEN a playback position is saved THEN the elapsed share is shown as a progress bar", () => {
    renderPanel(0.4);

    expect(screen.getByRole("progressbar", { name: "Playback progress" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  test("WHEN nothing has been watched or the lesson is a reading THEN no bar is drawn", () => {
    renderPanel(null);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resume" })).toBeInTheDocument();
  });

  test("WHEN rendered in es THEN the copy comes from the Spanish catalogue", () => {
    renderPanel(0.4, "es");

    expect(screen.getByRole("link", { name: "Reanudar" })).toBeInTheDocument();
  });
});
