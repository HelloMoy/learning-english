import { Course } from "@/domain/entities/course/course";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LevelsTable } from "./levels-table";

const buildCourse = (overrides: {
  slug: string;
  title: string;
  sequence: number;
  lessonCount?: number;
  moduleCount?: number;
}) =>
  Course.parse({
    id: faker.string.uuid(),
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: 48,
    moduleCount: 5,
    ...overrides,
  });

const basic = buildCourse({ slug: "basic-course", title: "Basic Course", sequence: 1 });
const advanced = buildCourse({
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  sequence: 2,
  lessonCount: 107,
  moduleCount: 10,
});

const rowsOf = () =>
  within(screen.getByRole("list", { name: "Available courses, in order" })).getAllByRole(
    "listitem",
  );

describe("LevelsTable", () => {
  test("WHEN courses arrive out of order THEN the rows follow their sequence", () => {
    renderInLocale(
      <LevelsTable
        courses={[advanced, basic]}
        continued={null}
      />,
    );

    const rows = rowsOf();
    expect(rows.map((row) => within(row).getByRole("heading", { level: 3 }).textContent)).toEqual([
      "Basic Course",
      "Advanced Intermediate Course",
    ]);
  });

  test("WHEN a row renders THEN it shows its level, description, counts and one link to the course", () => {
    renderInLocale(
      <LevelsTable
        courses={[basic, advanced]}
        continued={null}
      />,
    );

    const second = rowsOf()[1]!;
    expect(second).toHaveTextContent("Level 2");
    expect(second).toHaveTextContent(advanced.description);
    expect(second).toHaveTextContent("10 lessons · 107 videos");
    const links = within(second).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("View course");
    expect(links[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/courses/advanced-intermediate-course"),
    );
  });

  test("WHEN a course is being continued THEN only its row is marked with its progress", () => {
    renderInLocale(
      <LevelsTable
        courses={[basic, advanced]}
        continued={{ courseSlug: basic.slug, completedCount: 6 }}
      />,
    );

    const [first, second] = rowsOf();
    expect(within(first!).getByText("In progress")).toBeInTheDocument();
    expect(first).toHaveTextContent("6 of 48 videos");
    expect(within(first!).getByRole("link")).toHaveAccessibleName("Continue course");
    expect(within(second!).queryByText("In progress")).not.toBeInTheDocument();
    expect(within(second!).getByRole("link")).toHaveAccessibleName("View course");
  });

  test("WHEN rendered in es THEN ordinals, counts and links are Spanish", () => {
    renderInLocale(
      <LevelsTable
        courses={[basic]}
        continued={null}
      />,
      "es",
    );

    const row = within(
      screen.getByRole("list", { name: "Cursos disponibles, en orden" }),
    ).getByRole("listitem");
    expect(row).toHaveTextContent("Nivel 1");
    expect(row).toHaveTextContent("5 lecciones · 48 videos");
    expect(within(row).getByRole("link")).toHaveAccessibleName("Ver curso");
  });
});
