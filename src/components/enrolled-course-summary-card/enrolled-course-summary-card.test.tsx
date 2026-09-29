import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCardModel, aCourseView, everyVideoOf, lessonOf } from "@/test-setup/stubs/course-views";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EnrolledCourseSummaryCard } from "./enrolled-course-summary-card";

const basic = aCourseView("basic-course", 1, [1, 25]);

describe("EnrolledCourseSummaryCard", () => {
  describe("GIVEN a course part-way through", () => {
    const next = lessonOf(basic, 1, 11);
    const done = [lessonOf(basic, 0, 0), ...basic.moduleSummaries[1]!.lessons.slice(0, 11)].map(
      ({ id }) => id,
    );
    const model = aCardModel(basic, { recordAt: [1, 11], completed: done });

    test("WHEN it renders THEN it shows the course's share, title AND videos watched", () => {
      renderInLocale(
        <EnrolledCourseSummaryCard
          model={model}
          isCurrent={false}
        />,
      );

      const card = screen.getByTestId("enrolled-course-summary-card");
      expect(card).toHaveTextContent("46%");
      expect(
        screen.getByRole("heading", { level: 3, name: basic.course.title }),
      ).toBeInTheDocument();
      expect(card).toHaveTextContent("12 of 26 videos");
    });

    test("WHEN it renders THEN Next up names the video, its module AND its position", () => {
      renderInLocale(
        <EnrolledCourseSummaryCard
          model={model}
          isCurrent={false}
        />,
      );

      const card = screen.getByTestId("enrolled-course-summary-card");
      expect(card).toHaveTextContent("Next up");
      expect(card).toHaveTextContent(next.title);
      expect(card).toHaveTextContent(
        `Module 2 · ${basic.modules[1]!.title} · Video 12 of 25 · 10 min`,
      );
    });

    test("WHEN it renders THEN Continue opens the video AND View course the overview", () => {
      renderInLocale(
        <EnrolledCourseSummaryCard
          model={model}
          isCurrent={false}
        />,
      );

      expect(screen.getByRole("link", { name: /Continue/ })).toHaveAttribute(
        "href",
        `/courses/basic-course/modules/module-2/lessons/${next.id}`,
      );
      expect(screen.getByRole("link", { name: "View course" })).toHaveAttribute(
        "href",
        "/courses/basic-course",
      );
    });
  });

  describe("GIVEN the course My learning leads with", () => {
    test("WHEN it renders THEN the card is marked current", () => {
      renderInLocale(
        <EnrolledCourseSummaryCard
          model={aCardModel(basic)}
          isCurrent
        />,
      );

      expect(screen.getByTestId("enrolled-course-summary-card")).toHaveAttribute(
        "data-current",
        "true",
      );
    });
  });

  describe("GIVEN a finished course", () => {
    test("WHEN it renders THEN it offers Watch again", () => {
      renderInLocale(
        <EnrolledCourseSummaryCard
          model={aCardModel(basic, { completed: everyVideoOf(basic) })}
          isCurrent={false}
        />,
      );

      expect(screen.getByRole("link", { name: /Watch again/ })).toBeInTheDocument();
    });
  });

  describe("GIVEN the Spanish locale", () => {
    test("WHEN it renders THEN the copy comes from es.json", () => {
      renderInLocale(
        <EnrolledCourseSummaryCard
          model={aCardModel(basic)}
          isCurrent={false}
        />,
        "es",
      );

      expect(screen.getByText("Lo que sigue")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Ver curso" })).toBeInTheDocument();
    });
  });
});
