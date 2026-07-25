"use client";

import { InlineLessonNotes } from "@/components/lesson-notes/inline-lesson-notes";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Resource } from "@/domain/entities/resource/resource";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";

import { useTranslations } from "next-intl";

import { LessonBreadcrumb } from "../lesson-breadcrumb/lesson-breadcrumb";
import { MarkAsCompleteButton } from "../mark-as-complete-button/mark-as-complete-button";
import { NativeVideoPlayer } from "../native-video-player/native-video-player";
import { OutlineDrawer } from "../outline-drawer/outline-drawer";
import { ResourceList } from "../resource-list/resource-list";
import { UpNextCard } from "../up-next-card/up-next-card";

/**
 * The composition the Lesson Page renders. Receives the resolved `View`
 * from `findLessonForView` and the Server Action that completes a lesson.
 * Dispatches on `lesson.kind` so video and reading lessons render
 * appropriately (video → NativeVideoPlayer; reading → body).
 */
export function LessonView({
  view,
  notes,
  notesResource,
  markComplete,
}: {
  view: LessonViewData;
  notes: string | null;
  notesResource: Resource | null;
  markComplete: (input: { lessonId: LessonId }) => Promise<{ completed: boolean }>;
}) {
  const t = useTranslations("Components.NativeVideoPlayer");
  const tLessonNotes = useTranslations("Components.LessonNotes");
  const { course, module, lesson, resources, nextLesson, modules, lessons } = view;

  // Precompute the lessons-by-module map for the Outline.
  const lessonsByModuleId = new Map<string, Lesson[]>();
  for (const m of modules) lessonsByModuleId.set(m.id, []);
  for (const l of lessons) {
    const bucket = lessonsByModuleId.get(l.moduleId);
    if (bucket) bucket.push(l);
  }
  // Sort each module's lessons by sequence so the Outline renders in order.
  for (const m of modules) {
    const bucket = lessonsByModuleId.get(m.id);
    if (bucket) bucket.sort((a, b) => a.sequence - b.sequence);
  }

  // Resolve the next lesson's module so the Up next card links to the
  // correct module's route (the next lesson may belong to a different
  // module — see design.md §D4).
  const modulesById = new Map(modules.map((m) => [m.id, m]));
  const nextLessonModule = nextLesson ? (modulesById.get(nextLesson.moduleId) ?? null) : null;

  // The Resources region keeps the original Markdown resource link even
  // when notes are rendered inline, so the learner can open the file.
  // The Markdown resource is folded into a dedicated row beneath the
  // main Resources card so the section never appears empty when only
  // the notes resource is present.
  const nonNotesResources = resources.filter((r) => r.id !== notesResource?.id);
  const showNotesRow = notesResource !== null && notesResource !== undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr_1fr]">
      <OutlineDrawer
        course={course}
        modules={modules}
        lessonsByModuleId={lessonsByModuleId}
        currentLessonId={lesson.id}
      />

      <main className="space-y-4">
        <LessonBreadcrumb
          course={course}
          module={module}
          lesson={lesson}
        />
        {lesson.kind === "video" ? (
          <>
            <NativeVideoPlayer
              source={lesson.source}
              poster={lesson.poster}
              title={lesson.title}
              ariaLabel={t("videoPlayerLabel")}
            />
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-slate-700 dark:text-slate-300">{lesson.description}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <article className="prose dark:prose-invert">
              <p>{lesson.body}</p>
            </article>
          </>
        )}
        {notes ? <InlineLessonNotes markdown={notes} /> : null}
        <MarkAsCompleteButton
          lessonId={lesson.id}
          markComplete={markComplete}
        />
      </main>

      <aside className="space-y-4">
        <ResourceList resources={nonNotesResources} />
        {showNotesRow ? (
          <ResourceList
            resources={[notesResource]}
            titleOverride={tLessonNotes("resourceTitle")}
          />
        ) : null}
        <UpNextCard
          course={course}
          nextLesson={nextLesson}
          nextLessonModule={nextLessonModule}
        />
      </aside>
    </div>
  );
}
