import { Resource } from "@/domain/entities/resource/resource";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ResourceItem } from "./resource-item";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const fixtureResource = () =>
  Resource.parse({
    id: faker.string.uuid(),
    lessonId: faker.string.uuid(),
    title: faker.commerce.productName(),
    url: faker.internet.url(),
    kind: "pdf",
  });

describe("ResourceItem", () => {
  beforeEach(() => {
    // Identity translation: key in → key out.
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it shows the resource title as link text", () => {
    // Arrange
    const resource = fixtureResource();

    // Act
    render(<ResourceItem resource={resource} />);

    // Assert
    const link = screen.getByRole("link", { name: new RegExp(resource.title) });
    expect(link).toHaveAttribute("href", resource.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("WHEN rendered THEN the kind label is in the accessible name", () => {
    // Arrange
    const resource = fixtureResource();

    // Act
    render(<ResourceItem resource={resource} />);

    // Assert
    expect(screen.getByText("(pdf)")).toBeInTheDocument();
  });
});
