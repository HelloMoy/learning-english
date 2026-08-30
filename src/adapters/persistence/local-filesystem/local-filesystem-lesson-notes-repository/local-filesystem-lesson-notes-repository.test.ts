import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { LocalFilesystemBlobStore } from "@/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store";
import type { ResourceRow } from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import { LessonId } from "@/domain/entities/ids/ids";

import { LocalFilesystemLessonNotesRepository } from "./local-filesystem-lesson-notes-repository";

describe("LocalFilesystemLessonNotesRepository", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "notes-repo-"));
  const lessonId = "00000000-0000-4000-8000-000000000001";
  const lessonIdBranded = LessonId.parse(lessonId);
  const lessonIdOther = LessonId.parse("00000000-0000-4000-8000-000000000002");
  const notesKey = "course/welcome/readme.md";
  const notePath = path.join(dir, notesKey);
  mkdirSync(path.dirname(notePath), { recursive: true });
  writeFileSync(notePath, "# Welcome\n\nNotes body");

  const storeWith = (baseUrl: string) => new LocalFilesystemBlobStore({ baseUrl, localRoot: dir });

  const notesRow: ResourceRow = {
    id: "11111111-1111-4111-8111-111111111111",
    lessonId,
    title: "Welcome notes",
    url: notesKey,
    kind: "other",
  };

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns null when the lesson has no entry in the notes-key map", async () => {
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: {},
      resourceRows: [],
      blobStore: storeWith("/local-filesystem-lesson"),
    });
    await expect(repo.byLesson(lessonIdBranded)).resolves.toBeNull();
  });

  it("returns the notes view for a lesson with a mapped Markdown key", async () => {
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey },
      resourceRows: [notesRow],
      blobStore: storeWith("/local-filesystem-lesson"),
    });
    const result = await repo.byLesson(lessonIdBranded);
    expect(result).not.toBeNull();
    expect(result?.markdown).toBe("# Welcome\n\nNotes body");
    expect(result?.resource.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(result?.resource.url).toBe("/local-filesystem-lesson/course/welcome/readme.md");
  });

  it("finds the notes resource under a non-default base URL", async () => {
    // The regression this change exists to kill: matching on the RESOLVED
    // url couples the lookup to the base URL, and a mismatch returns null —
    // notes silently disappear with no error anywhere. Matching on the key
    // removes the coupling.
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey },
      resourceRows: [notesRow],
      blobStore: storeWith("https://cdn.example.com/course-content"),
    });
    const result = await repo.byLesson(lessonIdBranded);
    expect(result).not.toBeNull();
    expect(result?.markdown).toBe("# Welcome\n\nNotes body");
    expect(result?.resource.url).toBe(
      "https://cdn.example.com/course-content/course/welcome/readme.md",
    );
  });

  it("rejects non-Markdown keys before reading the file", async () => {
    const videoPath = path.join(dir, "course/welcome/welcome.mp4");
    writeFileSync(videoPath, "fake-bytes");
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: "course/welcome/welcome.mp4" },
      resourceRows: [],
      blobStore: storeWith("/local-filesystem-lesson"),
    });
    await expect(repo.byLesson(lessonIdBranded)).rejects.toMatchObject({
      reason: "binary",
    });
  });

  it("rejects traversal-like notes keys without touching the filesystem", async () => {
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: "../secrets.md" },
      resourceRows: [],
      blobStore: storeWith("/local-filesystem-lesson"),
    });
    await expect(repo.byLesson(lessonIdBranded)).rejects.toMatchObject({
      reason: "traversal",
    });
  });

  it("ignores notes entries for other lessons", async () => {
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey },
      resourceRows: [],
      blobStore: storeWith("/local-filesystem-lesson"),
    });
    await expect(repo.byLesson(lessonIdOther)).resolves.toBeNull();
  });
});
