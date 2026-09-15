import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LearnerQuestions } from "./learner-questions";

describe("LearnerQuestions", () => {
  test("WHEN rendered THEN the section announces the questions learners ask first", () => {
    renderInLocale(<LearnerQuestions />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Three questions learners ask first" }),
    ).toBeInTheDocument();
  });

  test("WHEN rendered THEN three numbered questions render in order, each with its answer", () => {
    renderInLocale(<LearnerQuestions />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((item) => within(item).getByTestId("question-ordinal").textContent)).toEqual([
      "01",
      "02",
      "03",
    ]);
    expect(
      within(items[0]!).getByRole("heading", {
        level: 3,
        name: "I already know grammar. Why start with sounds?",
      }),
    ).toBeInTheDocument();
    expect(items[2]).toHaveTextContent("Add it to your home screen");
  });

  test("WHEN rendered in pt THEN the questions come from the Portuguese catalogue", () => {
    renderInLocale(<LearnerQuestions />, "pt");

    expect(
      screen.getByRole("heading", { level: 3, name: "Posso praticar pelo celular?" }),
    ).toBeInTheDocument();
  });
});
