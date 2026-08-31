"use client";

import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { LessonList } from "../lesson-list/lesson-list";

/**
 * Renders the course's modules in `sequence` order, each with its lessons
 * listed below. `lessonsByModuleId` is the precomputed map of moduleId →
 * lessons (sorted by sequence) that the page passes in.
 *
 * @remarks
 * Each module title is a disclosure control, not a link: activating it
 * expands or collapses that module's lessons in place, so the learner
 * browses the course without leaving the lesson they are on. Any number of
 * modules can be open at once — expanding one never collapses another — and
 * the module owning the current lesson starts expanded.
 *
 * Collapsed modules keep their lessons unmounted rather than hidden, which
 * matters on the 107-lesson course: the DOM, the accessibility tree, and the
 * tab order stay small. Because the revealed list is unmounted while
 * collapsed, the control carries `aria-expanded` alone and no
 * `aria-controls` — the latter would be a dangling reference.
 *
 * Expansion is intentionally ephemeral: it is seeded on mount and never
 * persisted, so a reload or a navigation returns to "current module open".
 *
 * Each module title pins itself just below the outline heading while its own
 * lessons are on screen, so a learner scrolling a nine-exercise module never
 * loses sight of which module the exercises belong to. The offset comes from
 * `--outline-heading-offset`, published by the `Outline`. The title's
 * padding replaces what would otherwise be a transparent margin below it —
 * rows must pass behind the pinned title, never through a gap under it.
 *
 * @param course - The course the modules belong to; passed through to each lesson link
 * @param modules - Modules to render, already sorted by `sequence`
 * @param lessonsByModuleId - Precomputed moduleId → lessons map, each list sorted by `sequence`
 * @param currentLessonId - The lesson being viewed; its module starts expanded
 */
export function ModuleList({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
}: {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
}) {
  const currentModuleId = modules.find((mod) =>
    (lessonsByModuleId.get(mod.id) ?? []).some((lesson) => lesson.id === currentLessonId),
  )?.id;

  // Seeded once: navigating to another module is a full route change, so the
  // component remounts and re-seeds. Syncing on every render would discard the
  // modules the learner opened by hand.
  const [openModuleIds, setOpenModuleIds] = useState<ReadonlySet<string>>(
    () => new Set(currentModuleId ? [currentModuleId] : []),
  );

  function toggleModule(moduleId: string) {
    setOpenModuleIds((open) => {
      const next = new Set(open);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  return (
    <ol className="space-y-3">
      {modules.map((mod) => {
        const lessons = lessonsByModuleId.get(mod.id) ?? [];
        const isOpen = openModuleIds.has(mod.id);
        return (
          <li key={mod.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggleModule(mod.id)}
              className="sticky top-[var(--outline-heading-offset,0rem)] z-[5] flex min-h-9 w-full items-center justify-between gap-2 rounded bg-card px-1 pt-1 pb-2 text-left text-sm font-semibold text-foreground hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {mod.title}
              <ChevronRight
                aria-hidden="true"
                className={
                  isOpen
                    ? "size-4 shrink-0 rotate-90 transition-transform"
                    : "size-4 shrink-0 transition-transform"
                }
              />
            </button>
            {isOpen ? (
              <LessonList
                course={course}
                module={mod}
                lessons={lessons}
                currentLessonId={currentLessonId}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
