import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  classifyLessonFolder,
  classifyResourceKind,
  humanize,
  parseSequence,
  resourceTitleFromFile,
} from "./discriminate-lesson";

describe("classifyLessonFolder", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "classify-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("WHEN the folder contains only a video + thumbnail THEN it returns a `video` lesson", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "thumbnail.jpeg"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.videoKey).toBe("lesson-slug/lesson.mp4");
      expect(result.posterKey).toBe("lesson-slug/thumbnail.jpeg");
      expect(result.resourceKeys).toEqual([]);
      expect(result.readmeKey).toBeNull();
    }
  });

  test("WHEN the folder contains a video + readme THEN readme becomes a notes Resource", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "thumbnail.jpeg"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "readme.md"), "# notes");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.readmeKey).toBe("lesson-slug/readme.md");
      expect(result.resourceKeys).toContain("lesson-slug/readme.md");
    }
  });

  test("WHEN the folder contains a video + readme + PDF THEN both readme and PDF become resources", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "readme.md"), "# notes");
    writeFileSync(path.join(dir, "lesson-slug", "handout.pdf"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.resourceKeys).toContain("lesson-slug/readme.md");
      expect(result.resourceKeys).toContain("lesson-slug/handout.pdf");
    }
  });

  test("WHEN the folder contains only a readme THEN it returns a `reading` lesson with the file contents", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "readme.md"), "# Hello\n\nBody content.");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("reading");
    if (result.kind === "reading") {
      expect(result.body).toContain("Hello");
      expect(result.body).toContain("Body content.");
    }
  });

  test("WHEN the folder contains only a readme and a docx THEN the docx is a resource", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "readme.md"), "# notes");
    writeFileSync(path.join(dir, "lesson-slug", "exercise.docx"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("reading");
    if (result.kind === "reading") {
      expect(result.resourceKeys).toEqual(["lesson-slug/exercise.docx"]);
    }
  });

  test("WHEN the folder has neither video nor readme THEN it throws", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "thumbnail.jpeg"), "fake");

    // Act + Assert
    expect(() => classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug")).toThrow(
      /neither an .mp4 nor a readme.md/,
    );
  });
});

describe("classifyResourceKind", () => {
  test("WHEN the file is .pdf THEN it returns 'pdf'", () => {
    expect(classifyResourceKind("chart.pdf")).toBe("pdf");
  });

  test("WHEN the file is .pptx or .key THEN it returns 'slides'", () => {
    expect(classifyResourceKind("deck.pptx")).toBe("slides");
    expect(classifyResourceKind("deck.key")).toBe("slides");
  });

  test("WHEN the file is anything else THEN it returns 'other'", () => {
    expect(classifyResourceKind("notes.docx")).toBe("other");
    expect(classifyResourceKind("archive.zip")).toBe("other");
    expect(classifyResourceKind("image.png")).toBe("other");
  });
});

describe("resourceTitleFromFile", () => {
  test("WHEN the file is `vowel-chart.pdf` THEN it returns 'Vowel Chart'", () => {
    expect(resourceTitleFromFile("vowel-chart.pdf")).toBe("Vowel Chart");
  });

  test("WHEN the file has no extension THEN it humanizes the stem", () => {
    expect(resourceTitleFromFile("handout")).toBe("Handout");
  });
});

describe("humanize", () => {
  test("WHEN the slug has a leading number THEN the number is dropped", () => {
    expect(humanize("5-sound-natural-intonation-essentials")).toBe(
      "Sound Natural Intonation Essentials",
    );
  });

  test("WHEN the slug has no leading number THEN it capitalizes each word", () => {
    expect(humanize("intro")).toBe("Intro");
  });
});

describe("parseSequence", () => {
  test("WHEN the slug starts with a number THEN it returns that number", () => {
    expect(parseSequence("7-common-expressions")).toBe(7);
  });

  test("WHEN the slug has no leading number THEN it returns MAX_SAFE_INTEGER", () => {
    expect(parseSequence("intro")).toBe(Number.MAX_SAFE_INTEGER);
  });
});
