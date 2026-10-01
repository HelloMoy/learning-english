import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCardModel, aCourseView, everyVideoOf, lessonOf } from "@/test-setup/stubs/course-views";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ResumeTile } from "./resume-tile";

const DAY_MS = 24 * 60 * 60 * 1000;
const advanced = aCourseView("advanced-intermediate-course", 2, [4, 10]);

describe("ResumeTile", () => {
  describe("GIVEN the learner stopped part-way through a video", () => {
    const video = lessonOf(advanced, 1, 2);
    const model = aCardModel(advanced, {
      recordAt: [1, 2],
      watchedAt: Date.now() - DAY_MS,
      positions: new Map([[video.id, 365]]),
    });

    test("WHEN it renders THEN it offers to pick up there, naming the course, module AND position", () => {
      renderInLocale(<ResumeTile reading={{ status: "read", model }} />);

      expect(screen.getByText("Pick up where you left off")).toBeInTheDocument();
      expect(screen.getByTestId("resume-tile")).toHaveTextContent(
        `${advanced.course.title} · Module 02 · Video 3 of 10`,
      );
      expect(screen.getByRole("heading", { level: 2, name: video.title })).toBeInTheDocument();
    });

    test("WHEN it renders THEN it shows how far in AND when the course was last watched", () => {
      renderInLocale(<ResumeTile reading={{ status: "read", model }} />);

      const tile = screen.getByTestId("resume-tile");
      expect(tile).toHaveTextContent("06:05 / 10:00");
      expect(tile).toHaveTextContent(/watched (yesterday|1 day ago)/);
      expect(screen.getByTestId("resume-tile-progress")).toBeInTheDocument();
    });

    test("WHEN it renders THEN Resume opens the video", () => {
      renderInLocale(<ResumeTile reading={{ status: "read", model }} />);

      expect(screen.getByRole("link", { name: /Resume/ })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-2/lessons/${video.id}`,
      );
    });
  });

  describe("GIVEN a course never opened", () => {
    test("WHEN it renders THEN it offers to start at the first video, with no progress bar", () => {
      renderInLocale(<ResumeTile reading={{ status: "read", model: aCardModel(advanced) }} />);

      expect(screen.getByText("Start here")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Start/ })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-1/lessons/${lessonOf(advanced, 0, 0).id}`,
      );
      expect(screen.queryByTestId("resume-tile-progress")).toBeNull();
    });
  });

  describe("GIVEN a finished course", () => {
    test("WHEN it renders THEN the action reads Watch again", () => {
      const model = aCardModel(advanced, { completed: everyVideoOf(advanced) });

      renderInLocale(<ResumeTile reading={{ status: "read", model }} />);

      expect(screen.getByRole("link", { name: /Watch again/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN the learner's state is not read yet", () => {
    test("WHEN it renders THEN it shows a placeholder naming no lesson", () => {
      renderInLocale(<ResumeTile reading={{ status: "pending" }} />);

      expect(screen.getByTestId("resume-tile")).toHaveAttribute("data-status", "pending");
      expect(screen.queryByRole("heading")).toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  describe("GIVEN the Spanish locale", () => {
    test("WHEN it renders THEN the copy comes from es.json", () => {
      renderInLocale(
        <ResumeTile reading={{ status: "read", model: aCardModel(advanced) }} />,
        "es",
      );

      expect(screen.getByText("Empieza aquí")).toBeInTheDocument();
    });
  });
});
