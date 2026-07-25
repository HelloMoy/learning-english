import { LessonId } from "@/domain/entities/ids/ids";
import { Resource } from "@/domain/entities/resource/resource";
import type {
  LessonNotes,
  LessonNotesRepository,
} from "@/domain/ports/lesson-notes-repository/lesson-notes-repository";
import { makeFindLessonNotes } from "@/domain/use-cases/find-lesson-notes/find-lesson-notes";

const lessonId = LessonId.parse("00000000-0000-4000-8000-000000000001");

describe("findLessonNotes", () => {
  it("returns null when the lesson has no Markdown notes", async () => {
    const repo: LessonNotesRepository = {
      byLesson: async () => null,
    };
    const useCase = makeFindLessonNotes({ notes: repo });
    const result = await useCase({ lessonId });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toBeNull();
  });

  it("returns the notes view when the lesson has Markdown notes", async () => {
    const fixture: LessonNotes = {
      resource: Resource.parse({
        id: "11111111-1111-4111-8111-111111111111",
        lessonId,
        title: "Welcome notes",
        url: "/local-filesystem-lesson/course/welcome/readme.md",
        kind: "other",
      }),
      markdown: "# Welcome",
    };
    const repo: LessonNotesRepository = {
      byLesson: async () => fixture,
    };
    const useCase = makeFindLessonNotes({ notes: repo });
    const result = await useCase({ lessonId });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value).toEqual(fixture);
  });

  it("wraps adapter rejections as internal-error and never throws", async () => {
    const repo: LessonNotesRepository = {
      byLesson: async () => {
        throw new Error("disk read failed");
      },
    };
    const useCase = makeFindLessonNotes({ notes: repo });
    const result = await useCase({ lessonId });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.kind).toBe("internal-error");
  });
});
