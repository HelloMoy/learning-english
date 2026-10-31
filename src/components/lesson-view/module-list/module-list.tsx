"use client";

import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { WatchTally } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { cn } from "@/lib/utils/utils";

import { Check, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { CompletionRing } from "../completion-ring/completion-ring";
import { LessonList } from "../lesson-list/lesson-list";

/** The row ring's size, in pixels: one line of the module title tall. */
const ROW_RING_SIZE = 22;

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
 * Each title leads with a completion ring and states its reading beneath —
 * `4 / 6 videos · 67%`, `Lesson completed`, or the bare video count. The
 * tallies come from the caller rather than from a hook here, so the outline
 * counts once for its summary and its rows alike. A module the map does not
 * hold — every module before hydration — reads as its video count with an
 * empty ring, which is also exactly what a learner who has watched nothing
 * sees: the first frame claims nothing the page cannot know. The reading is
 * the disclosure's accessible *description*, not part of its name, so the
 * control is still announced by its title.
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
 * @param progressByModuleId - Completed-video tallies keyed by module id; empty when there is no reading yet
 */
export function ModuleList({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
  progressByModuleId,
}: {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
  progressByModuleId: ReadonlyMap<string, WatchTally>;
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
            <ModuleToggle
              title={mod.title}
              reading={moduleProgressReading(
                progressByModuleId.get(mod.id) ?? {
                  completedCount: 0,
                  lessonCount: lessons.length,
                },
              )}
              isOpen={isOpen}
              onToggle={() => toggleModule(mod.id)}
            />
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

/** Where the learner stands in one module, as the row states it. */
type ModuleProgressReading =
  | { kind: "untouched"; lessonCount: number }
  | { kind: "inProgress"; completedCount: number; lessonCount: number; fraction: number }
  | { kind: "completed" };

/**
 * Names the module's state so the row branches on a kind, not on arithmetic.
 *
 * @param tally - The module's completed and total video counts
 * @returns The reading the row renders
 */
function moduleProgressReading({ completedCount, lessonCount }: WatchTally): ModuleProgressReading {
  if (completedCount === 0) return { kind: "untouched", lessonCount };
  if (completedCount >= lessonCount) return { kind: "completed" };
  return {
    kind: "inProgress",
    completedCount,
    lessonCount,
    fraction: completedCount / lessonCount,
  };
}

/**
 * One module's disclosure: its ring, its title over its reading, and the chevron.
 *
 * @param title - The module title, which alone names the control
 * @param reading - The module's progress, stated beneath the title
 * @param isOpen - Whether the module's lessons are showing
 * @param onToggle - Expands or collapses the module
 */
function ModuleToggle({
  title,
  reading,
  isOpen,
  onToggle,
}: {
  title: string;
  reading: ModuleProgressReading;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const readingId = useId();
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-describedby={readingId}
      onClick={onToggle}
      className="sticky top-[var(--outline-heading-offset,0rem)] z-[5] flex min-h-9 w-full items-start gap-3 rounded bg-card px-1 pt-1 pb-2 text-left text-sm font-semibold text-foreground hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <ModuleProgressGlyph reading={reading} />
      <span className="min-w-0 flex-1">
        <span className="block">{title}</span>
        <ModuleProgressLine
          id={readingId}
          reading={reading}
        />
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn("mt-0.5 size-4 shrink-0 transition-transform", isOpen && "rotate-90")}
      />
    </button>
  );
}

/**
 * The row's leading mark: a ring filled to the share done, or a gold disc with
 * a check once the module is finished. Decorative — the line beside it says
 * the same thing in words.
 */
function ModuleProgressGlyph({ reading }: { reading: ModuleProgressReading }) {
  if (reading.kind === "completed") {
    return (
      <span
        data-testid="module-completed-mark"
        aria-hidden="true"
        className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-gold text-primary-foreground"
      >
        <Check
          aria-hidden="true"
          strokeWidth={3.5}
          className="size-3"
        />
      </span>
    );
  }
  return (
    <span aria-hidden="true">
      <CompletionRing
        size={ROW_RING_SIZE}
        fraction={reading.kind === "inProgress" ? reading.fraction : 0}
      />
    </span>
  );
}

/**
 * The reading under the title. Hidden from the accessibility tree where it
 * stands, so it does not join the control's name; the control points at it as
 * its description instead.
 */
function ModuleProgressLine({ id, reading }: { id: string; reading: ModuleProgressReading }) {
  const t = useTranslations("Components.Outline");
  const format = useFormatter();

  function readingText(): string {
    switch (reading.kind) {
      case "completed":
        return t("moduleCompleted");
      case "inProgress":
        return t("moduleProgress", {
          completed: reading.completedCount,
          total: reading.lessonCount,
          percent: format.number(reading.fraction, { style: "percent" }),
        });
      case "untouched":
        return t("moduleVideoCount", { total: reading.lessonCount });
    }
  }

  return (
    <span
      id={id}
      aria-hidden="true"
      className={cn(
        "mt-0.5 block text-xs font-medium",
        reading.kind === "completed" ? "text-gold" : "text-muted-foreground",
      )}
    >
      {readingText()}
    </span>
  );
}
