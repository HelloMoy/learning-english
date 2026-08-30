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

  /**
   * `Resource.url` admits two shapes (see `urlOrRelativePath`): an absolute
   * URL, and a site-relative path to a static asset under `public/`. The
   * test above covers the first; this one covers the second, which the
   * `faker.internet.url()` fixture never produces.
   *
   * NOTE: this is coverage, NOT the guard against the locale-prefix
   * regression. next-intl applies `localePrefix` during the *server*
   * render, so under jsdom even the locale-aware `Link` emits an
   * unprefixed href — this case passes whether or not the bug is present.
   * The real guard is the e2e case "resource links resolve" in
   * `e2e/lesson-page.spec.ts`.
   */
  test("WHEN the url is a site-relative asset path THEN it reaches the href unmodified", () => {
    // Arrange — a real seeded resource URL: a static file under `public/`.
    const url =
      "/local-filesystem-lesson/advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english/2-fast-i/fast-i-vowel-pronunciation-practice-see-sound.pdf";
    const resource = { ...fixtureResource(), url };

    // Act
    render(<ResourceItem resource={resource} />);

    // Assert
    const link = screen.getByRole("link", { name: new RegExp(resource.title) });
    expect(link).toHaveAttribute("href", url);
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
