import type { LessonId } from "@/domain/entities/ids/ids";
import type {
  LessonNotes,
  LessonNotesRepository,
} from "@/domain/ports/lesson-notes-repository/lesson-notes-repository";
import { ok, ResultAsync } from "@/domain/result/result";

import type { FindLessonNotesErrors } from "./find-lesson-notes.errors";

export type FindLessonNotes = (input: {
  lessonId: LessonId;
}) => ResultAsync<LessonNotes | null, FindLessonNotesErrors>;

const toInternalError = (cause: unknown): FindLessonNotesErrors => ({
  kind: "internal-error",
  cause,
});

export const makeFindLessonNotes = (deps: { notes: LessonNotesRepository }): FindLessonNotes => {
  const useCase = ({
    lessonId,
  }: {
    lessonId: LessonId;
  }): ResultAsync<LessonNotes | null, FindLessonNotesErrors> =>
    ResultAsync.fromPromise(deps.notes.byLesson(lessonId), toInternalError).andThen((notes) =>
      ok(notes),
    );
  return useCase;
};
