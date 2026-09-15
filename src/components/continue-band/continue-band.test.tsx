import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { ContinueBand } from "./continue-band";

const moduleId = ModuleId.parse(faker.string.uuid());
const lessonRuntimes = [0, 1, 2].map(() => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId,
  durationSeconds: 300,
}));

const profile = LearnerProfile.parse({
  name: "Ana García",
  avatar: { kind: "illustration", id: "plum" },
});

const level = { number: 1, courseTitle: "Basic Course" };

const renderBand = (locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <ContinueBand
      profile={profile}
      level={level}
      lessonRuntimes={lessonRuntimes}
      action={<a href="#continue">Continue</a>}
    />,
    locale,
  );

beforeEach(() => {
  window.localStorage.clear();
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
});

describe("ContinueBand", () => {
  test("WHEN rendered THEN it greets the learner by first name and repeats the action it is given", () => {
    renderBand();

    expect(screen.getByText("Keep going")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Pick up where you left off, Ana." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "#continue");
  });

  test("WHEN rendered THEN it shows the learner card with their progress through the course", () => {
    window.localStorage.setItem(`learning-english:completed:${lessonRuntimes[0]!.id}`, "1");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    renderBand();

    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avatar: Ana García" })).toBeInTheDocument();
    expect(screen.getByText("Level 1 · Basic Course")).toBeInTheDocument();
    expect(screen.getByText("1 of 3 videos")).toBeInTheDocument();
  });

  test("WHEN rendered in es THEN the copy comes from the Spanish catalogue", () => {
    renderBand("es");

    expect(
      screen.getByRole("heading", { level: 2, name: "Sigue donde lo dejaste, Ana." }),
    ).toBeInTheDocument();
  });
});
