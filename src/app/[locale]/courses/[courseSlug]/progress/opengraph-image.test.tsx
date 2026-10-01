import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { ShareCardProps } from "@/components/share-card/share-card";
import { shareHeadline } from "@/lib/share-headline/share-headline";

import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";

import Image from "./opengraph-image";

vi.mock("next-intl/server", () => import("@/test-setup/stubs/next-intl-server"));

// The real `ImageResponse` rasterises with Satori; the card's props are what
// this route decides, so the stand-in keeps the element it was handed.
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(readonly element: ReactElement<ShareCardProps>) {}
  },
}));

vi.mock("@/lib/share-card-fonts/share-card-fonts", () => ({
  shareCardFonts: async () => [],
}));

async function cardOf(courseSlug: string, locale: "en" | "es" | "pt"): Promise<ShareCardProps> {
  const response = (await Image({
    params: Promise.resolve({ locale, courseSlug }),
  })) as unknown as { element: ReactElement<ShareCardProps> };
  return response.element.props;
}

async function kickerOf(
  courseSlug: string,
  locale: "en" | "es" = "en",
): Promise<string | undefined> {
  return (await cardOf(courseSlug, locale)).kicker;
}

async function headlineOf(courseSlug: string, locale: "en" | "es" | "pt") {
  return (await cardOf(courseSlug, locale)).headline;
}

describe("the course sharing image", () => {
  test("WHEN the course is a level THEN the kicker names its level", async () => {
    expect(await kickerOf("basic-course")).toBe("Level 1");
  });

  test("WHEN the course is reference material THEN the kicker reads Reference", async () => {
    expect(await kickerOf("atlas-of-american-sounds")).toBe("Reference");
  });

  test("WHEN a reference course's card is served in es THEN the kicker is Spanish", async () => {
    expect(await kickerOf("atlas-of-american-sounds", "es")).toBe("Referencia");
  });

  test("WHEN the card is served in pt THEN the headline is the course's Portuguese description", async () => {
    // Arrange
    const basic = contentCatalog.courses.find((course) => course.slug === "basic-course")!;

    // Act
    const headline = await headlineOf("basic-course", "pt");

    // Assert
    expect(headline).toBe(shareHeadline(basic.translations!.pt!.description!));
  });
});
