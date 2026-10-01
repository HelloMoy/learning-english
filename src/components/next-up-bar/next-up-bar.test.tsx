import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { NextUpBar } from "./next-up-bar";

const basic = aCourseView("basic-course", 1, [2, 2]);

/** The first course as Available courses recommends it to a learner enrolled in nothing. */
const recommended = (() => {
  const shelf = courseShelf({
    courses: [basic],
    enrolledSlugs: new Set(),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
  });
  return courseCardModel(shelf.recommended!, { positions: new Map(), claimedPrizes: new Set() });
})();

const firstVideo = lessonOf(basic, 0, 0);
const bar = () => screen.getByTestId("next-up-bar");

describe("NextUpBar", () => {
  describe("GIVEN the recommended first course", () => {
    test("WHEN it renders THEN it names the course, its first video AND where that video sits", () => {
      // Act
      renderInLocale(<NextUpBar model={recommended} />);

      // Assert
      expect(bar()).toHaveTextContent(`Next up · ${basic.course.title}`);
      expect(bar()).toHaveTextContent(firstVideo.title);
      expect(bar()).toHaveTextContent("Module 01 · 0 of 4 videos · 40 min left");
      expect(bar()).toHaveTextContent("0%");
    });

    test("WHEN it renders THEN Start course opens the first video AND View course the course page at /about", () => {
      // Act
      renderInLocale(<NextUpBar model={recommended} />);

      // Assert
      expect(screen.getByRole("link", { name: /Start course/ })).toHaveAttribute(
        "href",
        `/courses/basic-course/modules/module-1/lessons/${firstVideo.id}`,
      );
      expect(screen.getByRole("link", { name: "View course" })).toHaveAttribute(
        "href",
        "/courses/basic-course/about",
      );
    });

    test("WHEN rendered in es THEN the copy comes from es.json", () => {
      // Act
      renderInLocale(<NextUpBar model={recommended} />, "es");

      // Assert
      expect(bar()).toHaveTextContent(`Lo que sigue · ${basic.course.title}`);
      expect(bar()).toHaveTextContent("Módulo 01 · 0 de 4 videos · faltan 40 min");
      expect(screen.getByRole("link", { name: /Empezar el curso/ })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Ver curso" })).toBeInTheDocument();
    });
  });
});
