import { Resource } from "@/domain/entities/resource/resource";

import { faker } from "@faker-js/faker";
import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ResourceList } from "./resource-list";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const makeResource = (kind: "pdf" | "slides" | "code" | "other", title: string) =>
  Resource.parse({
    id: faker.string.uuid(),
    lessonId: faker.string.uuid(),
    title,
    url: faker.internet.url(),
    kind,
  });

describe("ResourceList", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered with resources THEN it shows a heading and one row per resource", () => {
    // Arrange
    const resources = [makeResource("pdf", "Vowel chart"), makeResource("slides", "Drill slides")];

    // Act
    const { container } = render(<ResourceList resources={resources} />);
    const list = container.querySelector("ul");
    if (!list) throw new Error("expected <ul>");

    // Assert
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Vowel chart")).toBeInTheDocument();
    expect(screen.getByText("Drill slides")).toBeInTheDocument();
  });

  test("WHEN rendered with an empty array THEN it shows the empty-state message", () => {
    // Act
    render(<ResourceList resources={[]} />);

    // Assert
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
