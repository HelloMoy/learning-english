import { LessonId } from "@/domain/entities/ids/ids";
import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { faker } from "@faker-js/faker";
import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModulePoster } from "./module-poster";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const msg = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const aLesson = (sequence: number, poster?: string): ModuleLesson => ({
  id: LessonId.parse(faker.string.uuid()),
  sequence,
  title: faker.lorem.words(2),
  durationSeconds: 600,
  ...(poster ? { poster } : {}),
});

const withPosters = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    aLesson(index + 1, `/local-filesystem-lesson/poster-${index + 1}.jpeg`),
  );

const renderPoster = (lessons: ModuleLesson[], sequence = 3) => {
  const title = faker.lorem.words(2);
  render(
    <ModulePoster
      sequence={sequence}
      title={title}
      lessons={lessons}
      totalDurationSeconds={lessons.length * 600}
    />,
  );
  return { title };
};

describe("ModulePoster", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
  });

  describe("GIVEN a module holding many lessons with artwork", () => {
    test("WHEN the poster renders THEN it collages the first three lessons' artwork", () => {
      // Arrange + Act
      renderPoster(withPosters(25));

      // Assert
      const artwork = within(screen.getByTestId("module-poster")).getAllByRole("presentation");
      expect(artwork.map((image) => image.getAttribute("src"))).toEqual([
        "/local-filesystem-lesson/poster-1.jpeg",
        "/local-filesystem-lesson/poster-2.jpeg",
        "/local-filesystem-lesson/poster-3.jpeg",
      ]);
    });

    test("WHEN the poster renders THEN it shows the ordinal, the title AND the videos with their runtime", () => {
      // Arrange + Act
      const { title } = renderPoster(withPosters(25), 3);

      // Assert
      const poster = screen.getByTestId("module-poster");
      expect(within(poster).getByText("03")).toBeInTheDocument();
      expect(poster).toHaveTextContent(title);
      expect(poster).toHaveTextContent(
        msg("courseMetaShort", {
          videos: msg("videoCount", { count: 25 }),
          duration: msg("durationHoursMinutes", { hours: 4, minutes: 10 }),
        }),
      );
    });
  });

  describe("GIVEN a module holding a single lesson", () => {
    test("WHEN the poster renders THEN it shows that one image", () => {
      // Arrange + Act
      renderPoster(withPosters(1));

      // Assert
      expect(within(screen.getByTestId("module-poster")).getAllByRole("presentation")).toHaveLength(
        1,
      );
    });
  });

  describe("GIVEN a module whose lessons have no artwork", () => {
    test("WHEN the poster renders THEN it shows a placeholder AND no image", () => {
      // Arrange + Act
      renderPoster([aLesson(1), aLesson(2)]);

      // Assert
      const poster = screen.getByTestId("module-poster");
      expect(within(poster).getByTestId("module-poster-placeholder")).toBeInTheDocument();
      expect(within(poster).queryByRole("presentation")).toBeNull();
    });
  });
});
