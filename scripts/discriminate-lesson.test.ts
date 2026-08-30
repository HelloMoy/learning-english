import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  classifyLessonFolder,
  classifyResourceKind,
  humanize,
  normalizeApostrophes,
  notesHeading,
  parseSequence,
  resourceTitleFromFile,
} from "./discriminate-lesson";
import { normalizeFileName } from "./resolve-slug";

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

  test("WHEN the video/poster basenames have spaces and accents THEN the keys are slugified", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(
      path.join(dir, "lesson-slug", "Aprende Inglés Americano con Fluidez desde Cero.mp4"),
      "fake",
    );
    writeFileSync(
      path.join(dir, "lesson-slug", "Common English Expressions #32 Snapshot.jpeg"),
      "fake",
    );

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.videoKey).toBe(
        "lesson-slug/aprende-ingles-americano-con-fluidez-desde-cero.mp4",
      );
      expect(result.posterKey).toBe("lesson-slug/common-english-expressions-32-snapshot.jpeg");
    }
  });

  test("WHEN resources have raw filenames THEN resourceRawNames preserves them 1:1 with keys", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "Vowel Chart (v2).pdf"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "Drills 2024.PDF"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.resourceKeys.length).toBe(result.resourceRawNames.length);
      // Order matches: each raw name's normalized form equals the key basename.
      for (let i = 0; i < result.resourceKeys.length; i++) {
        const rawAt = result.resourceRawNames[i] as string;
        const keyBase = path.basename(result.resourceKeys[i] as string);
        expect(keyBase).toBe(normalizeFileName(rawAt));
      }
      // The raw names are the literal filenames (with spaces, case).
      const raws = result.resourceRawNames;
      expect(raws).toContain("Vowel Chart (v2).pdf");
      expect(raws).toContain("Drills 2024.PDF");
    }
  });

  test("WHEN a resource basename has special characters THEN its key is slugified", () => {
    // Arrange
    mkdirSync(path.join(dir, "lesson-slug"));
    writeFileSync(path.join(dir, "lesson-slug", "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, "lesson-slug", "Vowel Chart (v2).pdf"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "lesson-slug"), "lesson-slug");

    // Assert
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.resourceKeys).toContain("lesson-slug/vowel-chart-v2.pdf");
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

describe("classifyLessonFolder — title from the notes heading", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "classify-title-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** A video lesson folder whose readme opens with `heading`. */
  function videoLessonWithHeading(slug: string, heading: string): string {
    mkdirSync(path.join(dir, slug));
    writeFileSync(path.join(dir, slug, "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, slug, "readme.md"), `# ${heading}\n\nBody.\n`);
    return path.join(dir, slug);
  }

  test("WHEN enabled THEN the heading becomes the title, recovering what the slug lost", () => {
    // Arrange — the folder slug flattened "Fast /æ/" down to "4-fast".
    const folder = videoLessonWithHeading("4-fast", "Fast /æ/");

    // Act
    const result = classifyLessonFolder(folder, "4-fast", { titleFromNotesHeading: true });

    // Assert
    expect(result.title).toBe("Fast /æ/");
  });

  test("WHEN disabled THEN the slug-derived title is kept even though a heading exists", () => {
    // Arrange — this is what protects every module outside the allowlist.
    const folder = videoLessonWithHeading("4-fast", "Fast /æ/");

    // Act
    const result = classifyLessonFolder(folder, "4-fast", { titleFromNotesHeading: false });

    // Assert
    expect(result.title).toBe("Fast");
  });

  test("WHEN enabled and the folder has no readme THEN it falls back to the slug", () => {
    // Arrange
    mkdirSync(path.join(dir, "4-fast"));
    writeFileSync(path.join(dir, "4-fast", "lesson.mp4"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "4-fast"), "4-fast", {
      titleFromNotesHeading: true,
    });

    // Assert
    expect(result.title).toBe("Fast");
  });

  test("WHEN enabled and the readme has no heading THEN it falls back to the slug", () => {
    // Arrange
    mkdirSync(path.join(dir, "4-fast"));
    writeFileSync(path.join(dir, "4-fast", "lesson.mp4"), "fake");
    writeFileSync(path.join(dir, "4-fast", "readme.md"), "Just prose, no heading.\n");

    // Act
    const result = classifyLessonFolder(path.join(dir, "4-fast"), "4-fast", {
      titleFromNotesHeading: true,
    });

    // Assert
    expect(result.title).toBe("Fast");
  });

  test("WHEN the heading differs only in case THEN the slug-derived title wins", () => {
    // Arrange — capitalization survives slugification, so an all-caps
    // heading carries no information the slug lost.
    const folder = videoLessonWithHeading("1-intro", "INTRO");

    // Act
    const result = classifyLessonFolder(folder, "1-intro", { titleFromNotesHeading: true });

    // Assert
    expect(result.title).toBe("Intro");
  });

  test("WHEN the heading differs by punctuation THEN it is adopted", () => {
    // Arrange — the hyphen is real information the slug flattened away.
    const folder = videoLessonWithHeading("8-fast-cot-caught-merger", "Fast Cot-Caught Merger");

    // Act
    const result = classifyLessonFolder(folder, "8-fast-cot-caught-merger", {
      titleFromNotesHeading: true,
    });

    // Assert
    expect(result.title).toBe("Fast Cot-Caught Merger");
  });

  test("WHEN the lesson is a reading lesson THEN the same rules apply", () => {
    // Arrange — no video, so this exercises the other branch.
    mkdirSync(path.join(dir, "5-notes"));
    writeFileSync(path.join(dir, "5-notes", "readme.md"), "# Real /ɛ/ Title\n\nBody.\n");

    // Act
    const enabled = classifyLessonFolder(path.join(dir, "5-notes"), "5-notes", {
      titleFromNotesHeading: true,
    });
    const disabled = classifyLessonFolder(path.join(dir, "5-notes"), "5-notes", {
      titleFromNotesHeading: false,
    });

    // Assert
    expect(enabled.kind).toBe("reading");
    expect(enabled.title).toBe("Real /ɛ/ Title");
    expect(disabled.title).toBe("Notes");
  });

  test("WHEN an adopted heading has straight apostrophes THEN they are normalized", () => {
    // Arrange — the module mixes U+0027 and U+2019 across sibling lessons.
    const folder = videoLessonWithHeading("4-i-ll-you-ll", "I'll, you'll, he'll");

    // Act
    const result = classifyLessonFolder(folder, "4-i-ll-you-ll", {
      titleFromNotesHeading: true,
    });

    // Assert
    expect(result.title).toBe("I’ll, you’ll, he’ll");
    expect(result.title).not.toContain("'");
  });

  test("WHEN the title falls back to the slug THEN nothing is normalized", () => {
    // Arrange — slugification strips apostrophes, so there is nothing to convert.
    mkdirSync(path.join(dir, "4-i-ll-you-ll"));
    writeFileSync(path.join(dir, "4-i-ll-you-ll", "lesson.mp4"), "fake");

    // Act
    const result = classifyLessonFolder(path.join(dir, "4-i-ll-you-ll"), "4-i-ll-you-ll", {
      titleFromNotesHeading: true,
    });

    // Assert
    expect(result.title).toBe("I Ll You Ll");
  });

  test("WHEN a heading has mixed case, an ampersand or odd spacing THEN only apostrophes change", () => {
    // Arrange — this is the guard that stops the normalization rule from
    // quietly growing into a general title cleaner.
    const folder = videoLessonWithHeading(
      "2-why-contractions",
      "Why Contractions & Reductions are important",
    );

    // Act
    const result = classifyLessonFolder(folder, "2-why-contractions", {
      titleFromNotesHeading: true,
    });

    // Assert — the `&` survives, and so does the lowercase "are important".
    expect(result.title).toBe("Why Contractions & Reductions are important");
  });

  test("WHEN no options are passed THEN the slug-derived title is used", () => {
    // Arrange — the default must stay the old behaviour, so every existing
    // caller and test is unaffected.
    const folder = videoLessonWithHeading("4-fast", "Fast /æ/");

    // Act
    const result = classifyLessonFolder(folder, "4-fast");

    // Assert
    expect(result.title).toBe("Fast");
  });
});

describe("normalizeApostrophes", () => {
  // Asserted by code point, never by glyph: U+0027 and U+2019 are nearly
  // indistinguishable in a diff, so a visual comparison would pass either way.
  const STRAIGHT = "'";
  const TYPOGRAPHIC = "’";

  test("WHEN the text uses a straight apostrophe THEN it becomes typographic", () => {
    expect(normalizeApostrophes(`I${STRAIGHT}ll, you${STRAIGHT}ll`)).toBe(
      `I${TYPOGRAPHIC}ll, you${TYPOGRAPHIC}ll`,
    );
  });

  test("WHEN the text already uses the typographic apostrophe THEN it is unchanged", () => {
    const already = `I${TYPOGRAPHIC}m, you${TYPOGRAPHIC}re`;
    expect(normalizeApostrophes(already)).toBe(already);
  });

  test("WHEN the text has no apostrophes THEN it is unchanged", () => {
    expect(normalizeApostrophes("Fast Cot-Caught Merger")).toBe("Fast Cot-Caught Merger");
  });

  test("WHEN normalization runs twice THEN the result is identical", () => {
    const once = normalizeApostrophes(`it${STRAIGHT}s`);
    expect(normalizeApostrophes(once)).toBe(once);
  });
});

describe("notesHeading", () => {
  test("WHEN the markdown opens with an ATX heading THEN it returns that heading", () => {
    expect(notesHeading("# Fast /æ/\n\nSome prose.\n")).toBe("Fast /æ/");
  });

  test("WHEN the heading carries trailing whitespace THEN it is trimmed", () => {
    expect(notesHeading("#   Fast /ɔɪ/   \n")).toBe("Fast /ɔɪ/");
  });

  test("WHEN blank lines precede the heading THEN it is still found", () => {
    expect(notesHeading("\n\n\n# Fast /ʊ/\n")).toBe("Fast /ʊ/");
  });

  test("WHEN prose and sub-headings precede the first heading THEN the first `# ` wins", () => {
    // A `##` is not the lesson title, and neither is body text.
    expect(notesHeading("Intro paragraph.\n\n## Section\n\n# Real Title\n")).toBe("Real Title");
  });

  test("WHEN there is no ATX heading THEN it returns null", () => {
    expect(notesHeading("Just prose.\n\n## Only a sub-heading\n")).toBeNull();
  });

  test("WHEN the markdown is empty THEN it returns null", () => {
    expect(notesHeading("")).toBeNull();
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
