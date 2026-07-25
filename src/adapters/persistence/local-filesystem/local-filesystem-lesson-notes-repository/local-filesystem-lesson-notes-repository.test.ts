import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { LocalFilesystemBlobStore } from "@/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store";
import { LessonId } from "@/domain/entities/ids/ids";
import { Resource } from "@/domain/entities/resource/resource";

import { LocalFilesystemLessonNotesRepository } from "./local-filesystem-lesson-notes-repository";

describe("LocalFilesystemLessonNotesRepository", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "notes-repo-"));
  const lessonId = "00000000-0000-4000-8000-000000000001";
  const lessonIdBranded = LessonId.parse(lessonId);
  const lessonIdOther = LessonId.parse("00000000-0000-4000-8000-000000000002");
  const notePath = path.join(dir, "course/welcome/readme.md");
  mkdirSync(path.dirname(notePath), { recursive: true });
  writeFileSync(notePath, "# Welcome\n\nNotes body");

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns null when the lesson has no entry in the notes-key map", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: dir,
    });
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: {},
      resources: [],
      blobStore: store,
    });
    await expect(repo.byLesson(lessonIdBranded)).resolves.toBeNull();
  });

  it("returns the notes view for a lesson with a mapped Markdown key", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: dir,
    });
    const resource = Resource.parse({
      id: "11111111-1111-4111-8111-111111111111",
      lessonId,
      title: "Welcome notes",
      url: store.url("course/welcome/readme.md"),
      kind: "other",
    });
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: "course/welcome/readme.md" },
      resources: [resource],
      blobStore: store,
    });
    const result = await repo.byLesson(lessonIdBranded);
    expect(result).not.toBeNull();
    expect(result?.markdown).toBe("# Welcome\n\nNotes body");
    expect(result?.resource.id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rejects non-Markdown keys before reading the file", async () => {
    const videoPath = path.join(dir, "course/welcome/welcome.mp4");
    writeFileSync(videoPath, "fake-bytes");
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: dir,
    });
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: "course/welcome/welcome.mp4" },
      resources: [],
      blobStore: store,
    });
    await expect(repo.byLesson(lessonIdBranded)).rejects.toMatchObject({
      reason: "binary",
    });
  });

  it("rejects traversal-like notes keys without touching the filesystem", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: dir,
    });
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: "../secrets.md" },
      resources: [],
      blobStore: store,
    });
    await expect(repo.byLesson(lessonIdBranded)).rejects.toMatchObject({
      reason: "traversal",
    });
  });

  it("ignores notes entries for other lessons", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: dir,
    });
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: "course/welcome/readme.md" },
      resources: [],
      blobStore: store,
    });
    await expect(repo.byLesson(lessonIdOther)).resolves.toBeNull();
  });
});
