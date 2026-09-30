import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CinemaHeroArtwork } from "./cinema-hero-artwork";

describe("CinemaHeroArtwork", () => {
  describe("GIVEN a poster", () => {
    test("WHEN it renders THEN the poster is drawn as decoration", () => {
      // Arrange
      const poster = `/posters/${faker.string.alphanumeric(8)}.jpg`;

      // Act
      render(<CinemaHeroArtwork poster={poster} />);

      // Assert
      const image = screen.getByRole("presentation", { hidden: true });
      expect(image).toHaveAttribute("src", poster);
      expect(image).toHaveAttribute("alt", "");
    });
  });

  describe("GIVEN no poster", () => {
    test("WHEN it renders THEN no image is drawn", () => {
      // Arrange
      const poster = undefined;

      // Act
      render(<CinemaHeroArtwork poster={poster} />);

      // Assert
      expect(screen.queryByRole("presentation", { hidden: true })).not.toBeInTheDocument();
    });
  });
});
