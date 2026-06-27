import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Image from "next/image";

describe("next/image mock", () => {
  it("renders a plain <img> element with the provided props", () => {
    const src = faker.image.url();
    const alt = faker.lorem.words(3);
    const width = faker.number.int({ min: 50, max: 500 });
    const height = faker.number.int({ min: 50, max: 500 });

    render(
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        data-testid="img"
      />,
    );

    const img = screen.getByTestId("img");
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", src);
    expect(img).toHaveAttribute("alt", alt);
    expect(img).toHaveAttribute("width", String(width));
    expect(img).toHaveAttribute("height", String(height));
  });
});
