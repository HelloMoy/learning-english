import { renderInLocale } from "@/test-setup/render-in-locale";
import {
  aCardModel,
  aCourseView,
  asReference,
  everyVideoOf,
  lessonOf,
} from "@/test-setup/stubs/course-views";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EnrolledCourseCard } from "./enrolled-course-card";

const basic = aCourseView("basic-course", 1, [1, 3]);

describe("EnrolledCourseCard", () => {
  describe("GIVEN an enrolled course part-way through", () => {
    const next = lessonOf(basic, 1, 1);
    const model = aCardModel(basic, {
      recordAt: [1, 1],
      completed: [lessonOf(basic, 0, 0).id, lessonOf(basic, 1, 0).id],
    });

    test("WHEN it renders THEN it is enrolled, levelled AND titled by the course", () => {
      renderInLocale(<EnrolledCourseCard model={model} />);

      expect(screen.getByText("Enrolled")).toBeInTheDocument();
      expect(screen.getByText("Level 1")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 3, name: basic.course.title }),
      ).toBeInTheDocument();
    });

    test("WHEN it renders THEN it counts the videos AND names the next one with its module", () => {
      renderInLocale(<EnrolledCourseCard model={model} />);

      const card = screen.getByTestId("enrolled-course-card");
      expect(card).toHaveTextContent("2 of 4 · 50%");
      expect(card).toHaveTextContent(`Next up: ${next.title} · Module 02`);
    });

    test("WHEN it renders THEN Continue opens the next video AND View course the overview", () => {
      renderInLocale(<EnrolledCourseCard model={model} />);

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

  describe("GIVEN every video watched", () => {
    const model = aCardModel(basic, {
      completed: everyVideoOf(basic),
      claimedPrizes: ["module-1", "module-2"],
    });

    test("WHEN it renders THEN it reads Completed, counts its prizes AND offers Watch again", () => {
      renderInLocale(<EnrolledCourseCard model={model} />);

      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getByTestId("enrolled-course-card")).toHaveTextContent("2 of 2 prizes");
      expect(screen.getByRole("link", { name: /Watch again/ })).toHaveAttribute(
        "href",
        `/courses/basic-course/modules/module-1/lessons/${lessonOf(basic, 0, 0).id}`,
      );
      expect(screen.queryByText("Enrolled")).toBeNull();
    });
  });

  describe("GIVEN the Portuguese locale", () => {
    test("WHEN it renders THEN the copy comes from pt.json", () => {
      renderInLocale(<EnrolledCourseCard model={aCardModel(basic)} />, "pt");

      expect(screen.getByText("Inscrito")).toBeInTheDocument();
      expect(screen.getByText("Nível 1")).toBeInTheDocument();
    });
  });

  describe("GIVEN an enrolled reference course", () => {
    const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2]));

    test("WHEN it renders THEN it reads Reference where a level reads Level N", () => {
      renderInLocale(<EnrolledCourseCard model={aCardModel(atlas)} />);

      expect(screen.getByText("Reference")).toBeInTheDocument();
      expect(screen.queryByText(/Level \d/)).not.toBeInTheDocument();
    });
  });
});
