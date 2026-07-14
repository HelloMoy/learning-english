"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
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
  markComplete,
}: {
  view: LessonViewData;
  markComplete: (input: { lessonId: LessonId }) => Promise<{ completed: boolean }>;
}) {
  const t = useTranslations("Components.NativeVideoPlayer");
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
        <MarkAsCompleteButton
          lessonId={lesson.id}
          markComplete={markComplete}
        />
      </main>

      <aside className="space-y-4">
        <ResourceList resources={resources} />
        <UpNextCard
          course={course}
          nextLesson={nextLesson}
          nextLessonModule={nextLessonModule}
        />
      </aside>
    </div>
  );
}
