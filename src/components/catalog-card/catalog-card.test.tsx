import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, asReference, lessonOf } from "@/test-setup/stubs/course-views";

import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CatalogCard } from "./catalog-card";

const advanced = aCourseView("advanced-intermediate-course", 2, [2, 10]);
const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [4]));

describe("CatalogCard", () => {
  describe("GIVEN a catalog of three courses, two not joined, teasing Advanced", () => {
    const renderCard = (locale: "en" | "es" = "en") =>
      renderInLocale(
        <CatalogCard
          courseCount={3}
          notJoinedCount={2}
          teaser={advanced}
        />,
        locale,
      );

    test("WHEN it renders THEN the whole card opens Available courses", () => {
      renderCard();

      expect(screen.getByRole("link", { name: /All available courses/ })).toHaveAttribute(
        "href",
        "/courses",
      );
    });

    test("WHEN it renders THEN it counts the catalog AND the courses not joined", () => {
      renderCard();

      const card = screen.getByTestId("catalog-card");
      expect(card).toHaveTextContent("Catalog · 3 courses");
      expect(
        within(card).getByRole("heading", { level: 3, name: "All available courses" }),
      ).toBeInTheDocument();
      expect(card).toHaveTextContent("You haven’t joined 2 of them yet.");
      expect(card).toHaveTextContent("See all courses");
    });

    test("WHEN it renders THEN the teased course opens its course page", () => {
      renderCard();

      expect(screen.getByRole("link", { name: new RegExp(advanced.course.title) })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course/about",
      );
    });

    test("WHEN it renders THEN it teases Advanced with its level, video count AND first video", () => {
      renderCard();

      const teaser = screen.getByTestId("catalog-card-teaser");
      expect(teaser).toHaveTextContent(advanced.course.title);
      expect(teaser).toHaveTextContent("Level 2 · 12 videos");
      expect(teaser.querySelector("img")).toHaveAttribute("src", lessonOf(advanced, 0, 0).poster);
    });

    test("WHEN rendered in es THEN the copy comes from es.json", () => {
      renderCard("es");

      const card = screen.getByTestId("catalog-card");
      expect(card).toHaveTextContent("Cartelera · 3 cursos");
      expect(card).toHaveTextContent("Todos los cursos disponibles");
      expect(card).toHaveTextContent("Aún no te has inscrito en 2 de ellos.");
      expect(card).toHaveTextContent("Nivel 2 · 12 videos");
      expect(card).toHaveTextContent("Ver todos los cursos");
    });
  });

  test("WHEN the teaser is a reference course THEN it is labelled Reference", () => {
    renderInLocale(
      <CatalogCard
        courseCount={3}
        notJoinedCount={1}
        teaser={atlas}
      />,
    );

    expect(screen.getByTestId("catalog-card-teaser")).toHaveTextContent("Reference · 4 videos");
    expect(screen.getByTestId("catalog-card")).toHaveTextContent(
      "You haven’t joined 1 of them yet.",
    );
  });

  test("WHEN the learner has joined every course THEN it says so AND teases nothing", () => {
    renderInLocale(
      <CatalogCard
        courseCount={3}
        notJoinedCount={0}
      />,
    );

    expect(screen.getByTestId("catalog-card")).toHaveTextContent("You’re enrolled in all of them.");
    expect(screen.queryByTestId("catalog-card-teaser")).not.toBeInTheDocument();
  });
});
