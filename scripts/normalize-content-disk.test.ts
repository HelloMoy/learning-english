import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { normalizeContentDisk } from "./normalize-content-disk";

describe("normalizeContentDisk", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "normalize-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const mkfile = (rel: string, body = "x"): void => {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  };

  test("WHEN applied THEN folders and file basenames are renamed to their slugs", () => {
    // Arrange
    mkfile(
      "test-course/8 Everyday English Phrases PART 2 Master Them!/1 Common Expressions #32/Aprende Inglés.mp4",
    );

    // Act
    normalizeContentDisk({ rootDir: root, apply: true });

    // Assert — the whole path is now kebab-case ASCII.
    const expected = path.join(
      root,
      "test-course/8-everyday-english-phrases-part-2-master-them/1-common-expressions-32/aprende-ingles.mp4",
    );
    expect(existsSync(expected)).toBe(true);
  });

  test("WHEN run in dry-run THEN nothing on disk changes and the plan is returned", () => {
    // Arrange
    mkfile("test-course/1 First Module/01 Intro/Vowel Chart.pdf");

    // Act
    const result = normalizeContentDisk({ rootDir: root, apply: false });

    // Assert — original raw path still present, no manifest, plan non-empty.
    expect(existsSync(path.join(root, "test-course/1 First Module/01 Intro/Vowel Chart.pdf"))).toBe(
      true,
    );
    expect(result.manifestPath).toBeNull();
    expect(result.renames.length).toBeGreaterThan(0);
    expect(result.renames).toContainEqual({
      from: "test-course/1 First Module/01 Intro/Vowel Chart.pdf",
      to: "test-course/1-first-module/01-intro/vowel-chart.pdf",
    });
  });

  test("WHEN applied THEN a rename-manifest.json is written mapping original → slug paths", () => {
    // Arrange
    mkfile("test-course/1 First Module/readme.md");

    // Act
    const result = normalizeContentDisk({ rootDir: root, apply: true });

    // Assert
    expect(result.manifestPath).toBe(path.join(root, "rename-manifest.json"));
    const manifest = JSON.parse(readFileSync(result.manifestPath as string, "utf8")) as {
      version: number;
      entries: Array<{ from: string; to: string }>;
    };
    expect(manifest.version).toBe(1);
    expect(manifest.entries).toContainEqual({
      from: "test-course/1 First Module",
      to: "test-course/1-first-module",
    });
  });

  test("WHEN re-run on an already-normalized tree THEN it is a no-op", () => {
    // Arrange
    mkfile("test-course/1 First Module/01 Intro/lesson.mp4");
    normalizeContentDisk({ rootDir: root, apply: true });

    // Act — second pass.
    const second = normalizeContentDisk({ rootDir: root, apply: true });

    // Assert
    expect(second.renames).toEqual([]);
  });

  test("WHEN two distinct names collide to the same slug THEN it throws and renames nothing", () => {
    // Arrange — both normalize to "intro" but differ by more than case.
    mkfile("test-course/mod/Intro/lesson.mp4");
    mkfile("test-course/mod/intro!/lesson.mp4");

    // Act + Assert
    expect(() => normalizeContentDisk({ rootDir: root, apply: true })).toThrow(/collision/i);
    // The colliding directory was not partially renamed.
    const modEntries = readdirSync(path.join(root, "test-course", "mod")).sort();
    expect(modEntries).toEqual(["Intro", "intro!"]);
  });

  test("WHEN a folder differs from its slug only by case THEN it is renamed via a temp step", () => {
    // Arrange
    mkfile("test-course/Intro/lesson.mp4");

    // Act
    normalizeContentDisk({ rootDir: root, apply: true });

    // Assert — folder is now lowercase, file intact.
    expect(existsSync(path.join(root, "test-course/intro/lesson.mp4"))).toBe(true);
  });

  test("WHEN a hidden/system file is present THEN it is skipped, not renamed", () => {
    // Arrange
    mkfile("test-course/1 First Module/.DS_Store");
    mkfile("test-course/1 First Module/lesson.mp4");

    // Act
    normalizeContentDisk({ rootDir: root, apply: true });

    // Assert — the dotfile is left untouched under the renamed folder.
    expect(existsSync(path.join(root, "test-course/1-first-module/.DS_Store"))).toBe(true);
  });
});
