import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CourseSoundStrip } from "./course-sound-strip";

const sounds = { vowels: ["ə", "ɪ", "aɪ"], consonants: ["θ", "ð", "ŋ", "ɾ"] };

const symbolsIn = (list: HTMLElement) =>
  within(list)
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("CourseSoundStrip", () => {
  describe("GIVEN a course that teaches vowels and consonants", () => {
    test("WHEN it renders THEN the heading counts every sound", () => {
      // Arrange
      const declared = sounds;

      // Act
      renderInLocale(<CourseSoundStrip sounds={declared} />);

      // Assert
      expect(
        screen.getByRole("heading", { level: 2, name: "7 sounds you’ll master" }),
      ).toBeInTheDocument();
    });

    test("WHEN it renders THEN the vowels AND the consonants are listed apart in declared order", () => {
      // Arrange
      const declared = sounds;

      // Act
      renderInLocale(<CourseSoundStrip sounds={declared} />);

      // Assert
      expect(symbolsIn(screen.getByRole("list", { name: "Vowels" }))).toEqual(declared.vowels);
      expect(symbolsIn(screen.getByRole("list", { name: "Consonants" }))).toEqual(
        declared.consonants,
      );
    });

    test("WHEN rendered in pt THEN the heading AND group names come from pt.json", () => {
      // Arrange
      const declared = sounds;

      // Act
      renderInLocale(<CourseSoundStrip sounds={declared} />, "pt");

      // Assert
      expect(
        screen.getByRole("heading", { level: 2, name: "7 sons que você vai dominar" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Vogais" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a course that declares no sounds", () => {
    test("WHEN it renders THEN nothing renders", () => {
      // Arrange
      const declared = { vowels: [], consonants: [] };

      // Act
      const { container } = renderInLocale(<CourseSoundStrip sounds={declared} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });
  });
});
