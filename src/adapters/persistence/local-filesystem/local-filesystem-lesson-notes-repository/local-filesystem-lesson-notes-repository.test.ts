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

describe("LocalFilesystemLessonNotesRepository — caching", () => {
  const lessonId = LessonId.parse("00000000-0000-4000-8000-000000000001");
  const otherLessonId = LessonId.parse("00000000-0000-4000-8000-000000000002");
  const notesKey = "course/welcome/readme.md";
  const otherKey = "course/farewell/readme.md";

  /** A store that counts reads, standing in for a bucket round trip. */
  function countingStore() {
    const reads: string[] = [];
    return {
      reads,
      blobStore: {
        url: (key: string) => `/content/${key}`,
        exists: async () => true,
        readText: async (key: string) => {
          reads.push(key);
          return `# ${key}`;
        },
      },
    };
  }

  const rowFor = (id: string, key: string): ResourceRow => ({
    id: `11111111-1111-4111-8111-11111111111${key.length % 10}`,
    lessonId: id,
    title: "Notes",
    url: key,
    kind: "other",
  });

  it("reads a lesson's notes once however many times they are viewed", async () => {
    // Against the local driver this is a disk read; against a bucket it is a
    // network round trip on every lesson view, which is what the cache is for.
    const store = countingStore();
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey },
      resourceRows: [rowFor(lessonId, notesKey)],
      blobStore: store.blobStore,
    });

    await repo.byLesson(lessonId);
    await repo.byLesson(lessonId);
    await repo.byLesson(lessonId);

    expect(store.reads).toEqual([notesKey]);
  });

  it("keeps different keys apart rather than serving one from the other", async () => {
    const store = countingStore();
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey, [otherLessonId]: otherKey },
      resourceRows: [rowFor(lessonId, notesKey), rowFor(otherLessonId, otherKey)],
      blobStore: store.blobStore,
    });

    const first = await repo.byLesson(lessonId);
    const second = await repo.byLesson(otherLessonId);

    expect(first?.markdown).toBe(`# ${notesKey}`);
    expect(second?.markdown).toBe(`# ${otherKey}`);
    expect(store.reads).toEqual([notesKey, otherKey]);
  });

  it("caches by content key, so two lessons sharing notes cost one read", async () => {
    const store = countingStore();
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey, [otherLessonId]: notesKey },
      resourceRows: [rowFor(lessonId, notesKey), rowFor(otherLessonId, notesKey)],
      blobStore: store.blobStore,
    });

    await repo.byLesson(lessonId);
    await repo.byLesson(otherLessonId);

    expect(store.reads).toEqual([notesKey]);
  });

  it("does not cache a failed read, so a transient error is retried", async () => {
    let attempt = 0;
    const repo = new LocalFilesystemLessonNotesRepository({
      notesKeys: { [lessonId]: notesKey },
      resourceRows: [rowFor(lessonId, notesKey)],
      blobStore: {
        url: (key: string) => `/content/${key}`,
        exists: async () => true,
        readText: async () => {
          attempt += 1;
          if (attempt === 1) throw new Error("network blip");
          return "# recovered";
        },
      },
    });

    await expect(repo.byLesson(lessonId)).rejects.toThrow("network blip");
    await expect(repo.byLesson(lessonId)).resolves.toMatchObject({ markdown: "# recovered" });
  });
});
