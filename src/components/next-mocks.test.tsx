import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import Image from "next/image";
import { describe, expect, test } from "vitest";

describe("next/image mock", () => {
  describe("GIVEN an Image with src, alt, width and height", () => {
    test("WHEN rendered THEN it outputs a plain <img> element with the same props", () => {
      // Arrange
      const src = faker.image.url();
      const alt = faker.lorem.words(3);
      const width = faker.number.int({ min: 50, max: 500 });
      const height = faker.number.int({ min: 50, max: 500 });

      // Act
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

      // Assert
      expect(img.tagName).toBe("IMG");
      expect(img).toHaveAttribute("src", src);
      expect(img).toHaveAttribute("alt", alt);
      expect(img).toHaveAttribute("width", String(width));
      expect(img).toHaveAttribute("height", String(height));
    });
  });
});
