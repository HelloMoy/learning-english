import type { ShareCardProps } from "@/components/share-card/share-card";

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

async function kickerOf(
  courseSlug: string,
  locale: "en" | "es" = "en",
): Promise<string | undefined> {
  const response = (await Image({
    params: Promise.resolve({ locale, courseSlug }),
  })) as unknown as { element: ReactElement<ShareCardProps> };
  return response.element.props.kicker;
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
});
