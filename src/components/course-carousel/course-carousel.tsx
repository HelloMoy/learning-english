"use client";

import { LessonProgressPanel } from "@/components/lesson-progress-panel/lesson-progress-panel";
import { ModulePoster } from "@/components/module-poster/module-poster";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useHorizontalSwipe } from "@/hooks/use-horizontal-swipe/use-horizontal-swipe";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { lessonPath, moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { moduleProgress, selectInitialModuleIndex } from "@/lib/module-progress/module-progress";
import { cn } from "@/lib/utils/utils";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type CarouselEntry = { module: Module; summary: ModuleSummary };

type CourseCarouselProps = {
  course: Course;
  modules: ReadonlyArray<Module>;
  moduleSummaries: ReadonlyArray<ModuleSummary>;
};

/**
 * Size, place and fade for a poster by how far it sits from the selection.
 * Below `lg` only the neighbours peek in from the screen edges; from `lg` two
 * posters show on each side.
 */
const POSITION_CLASSES: Record<string, string> = {
  "-2": "z-10 hidden h-[270px] w-[180px] opacity-40 lg:block [--offset:-510px]",
  "-1": "z-20 h-[300px] w-[200px] opacity-50 [--offset:-240px] lg:h-[345px] lg:w-[230px] lg:opacity-70 lg:[--offset:-285px]",
  "0": "z-30 h-[360px] w-[240px] opacity-100 [--offset:0px] lg:h-[450px] lg:w-[300px]",
  "1": "z-20 h-[300px] w-[200px] opacity-50 [--offset:240px] lg:h-[345px] lg:w-[230px] lg:opacity-70 lg:[--offset:285px]",
  "2": "z-10 hidden h-[270px] w-[180px] opacity-40 lg:block [--offset:510px]",
};
const OFF_STAGE_CLASSES = "hidden";

/**
 * The course's modules as a carousel of cinema posters, with the progress panel
 * for whichever module is selected.
 *
 * @remarks
 * One module is selected at a time. Its poster sits in the centre, larger and
 * edged in gold; neighbours shrink and fade with distance. The selection moves
 * with the arrow buttons, the dots, the Left/Right keys while focus is inside
 * the carousel, a sideways swipe, or a click on a neighbour. The selected
 * poster is a link: to the module overview, or straight to the lesson when the
 * module holds only one.
 *
 * The server renders the first module selected. Once hydrated, the carousel
 * moves to the module the learner is part-way through (see
 * `selectInitialModuleIndex`) — unless the learner has already chosen one.
 *
 * Selection changes are announced politely as "Lesson N of M: title".
 *
 * @example
 * ```tsx
 * <CourseCarousel course={course} modules={modules} moduleSummaries={moduleSummaries} />
 * ```
 */
export function CourseCarousel({ course, modules, moduleSummaries }: CourseCarouselProps) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const entries = pairWithSummaries(modules, moduleSummaries);
  const { selectedIndex, select } = useCarouselSelection(entries);
  const selectPrevious = () => select(selectedIndex - 1);
  const selectNext = () => select(selectedIndex + 1);
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: selectNext,
    onSwipeRight: selectPrevious,
  });
  const selected = entries[selectedIndex];

  const moveWithArrowKeys = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") selectPrevious();
    else if (event.key === "ArrowRight") selectNext();
    else return;
    event.preventDefault();
  };

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-roledescription="carousel"
        aria-label={t("carouselLabel")}
        onKeyDown={moveWithArrowKeys}
        className="flex flex-col gap-6"
      >
        <div
          {...swipeHandlers}
          data-testid="carousel-stage"
          className="relative h-[400px] touch-pan-y overflow-x-clip lg:h-[500px]"
        >
          {entries.map((entry, index) => (
            <CarouselPoster
              key={entry.module.id}
              course={course}
              entry={entry}
              distance={index - selectedIndex}
              onSelect={() => select(index)}
            />
          ))}
          <CarouselArrows
            canGoBack={selectedIndex > 0}
            canGoForward={selectedIndex < entries.length - 1}
            onPrevious={selectPrevious}
            onNext={selectNext}
          />
        </div>
        <CarouselDots
          entries={entries}
          selectedIndex={selectedIndex}
          onSelect={select}
        />
        <p
          data-testid="carousel-announcement"
          aria-live="polite"
          className="sr-only"
        >
          {t("selectionAnnouncement", {
            number: selectedIndex + 1,
            total: entries.length,
            title: selected.module.title,
          })}
        </p>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-11">
        <LessonProgressPanel
          key={selected.module.id}
          course={course}
          module={selected.module}
          summary={selected.summary}
        />
      </div>
    </div>
  );
}

/**
 * The selected index, starting on the first module and moving — once hydrated —
 * to the module the learner is part-way through, until the learner picks one.
 */
function useCarouselSelection(entries: ReadonlyArray<CarouselEntry>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const learnerHasChosen = useRef(false);
  const isHydrated = useIsHydrated();
  const completedIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  const resumeIndex = selectInitialModuleIndex(
    entries.map(({ summary }) =>
      moduleProgress({ lessons: summary.lessons, completedIds, positions }),
    ),
  );

  useEffect(() => {
    if (isHydrated && !learnerHasChosen.current) setSelectedIndex(resumeIndex);
  }, [isHydrated, resumeIndex]);

  const select = (index: number) => {
    if (index < 0 || index >= entries.length) return;
    learnerHasChosen.current = true;
    setSelectedIndex(index);
  };

  return { selectedIndex, select };
}

function CarouselPoster({
  course,
  entry,
  distance,
  onSelect,
}: {
  course: Course;
  entry: CarouselEntry;
  distance: number;
  onSelect: () => void;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const { module, summary } = entry;
  const isSelected = distance === 0;
  const poster = (
    <ModulePoster
      sequence={module.sequence}
      title={module.title}
      lessons={summary.lessons}
      totalDurationSeconds={summary.totalDurationSeconds}
      featured={isSelected}
    />
  );

  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 translate-x-[calc(-50%_+_var(--offset))] -translate-y-1/2 transition-[translate,width,height,opacity] duration-300 motion-reduce:transition-none",
        POSITION_CLASSES[String(distance)] ?? OFF_STAGE_CLASSES,
      )}
    >
      {isSelected ? (
        <Link
          href={posterHref(course, entry) as never}
          aria-label={module.title}
          data-testid="carousel-poster"
          className="block size-full overflow-hidden rounded-[18px] border-2 border-gold shadow-[0_0_0_6px_color-mix(in_oklab,var(--gold)_14%,transparent),0_50px_90px_-30px_rgba(0,0,0,0.9)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {poster}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={t("showLesson", { number: module.sequence, title: module.title })}
          data-testid="carousel-poster"
          tabIndex={Math.abs(distance) > 1 ? -1 : undefined}
          onClick={onSelect}
          className="block size-full cursor-pointer overflow-hidden rounded-2xl border border-border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {poster}
        </button>
      )}
    </div>
  );
}

function CarouselArrows({
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
}: {
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const arrowClasses =
    "absolute top-1/2 z-40 hidden size-13 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-foreground transition-colors hover:border-gold/60 hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 lg:flex";
  return (
    <>
      <button
        type="button"
        aria-label={t("previousLesson")}
        disabled={!canGoBack}
        onClick={onPrevious}
        className={cn(arrowClasses, "left-[max(1.5rem,calc(50%-640px))]")}
      >
        <ChevronLeft
          aria-hidden="true"
          className="size-5"
        />
      </button>
      <button
        type="button"
        aria-label={t("nextLesson")}
        disabled={!canGoForward}
        onClick={onNext}
        className={cn(arrowClasses, "right-[max(1.5rem,calc(50%-640px))]")}
      >
        <ChevronRight
          aria-hidden="true"
          className="size-5"
        />
      </button>
    </>
  );
}

function CarouselDots({
  entries,
  selectedIndex,
  onSelect,
}: {
  entries: ReadonlyArray<CarouselEntry>;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <div className="flex justify-center">
      {entries.map(({ module }, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={module.id}
            type="button"
            data-testid="carousel-dot"
            aria-label={t("showLesson", { number: module.sequence, title: module.title })}
            aria-current={isSelected ? "true" : undefined}
            onClick={() => onSelect(index)}
            className="flex h-11 items-center justify-center px-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none",
                isSelected ? "w-7 bg-gold" : "w-2 bg-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function pairWithSummaries(
  modules: ReadonlyArray<Module>,
  moduleSummaries: ReadonlyArray<ModuleSummary>,
): CarouselEntry[] {
  const summaryByModule = new Map(moduleSummaries.map((summary) => [summary.moduleId, summary]));
  return modules.flatMap((module) => {
    const summary = summaryByModule.get(module.id);
    return summary ? [{ module, summary }] : [];
  });
}

function posterHref(course: Course, { module, summary }: CarouselEntry): string {
  const [onlyLesson] = summary.lessons;
  if (summary.lessonCount === 1 && onlyLesson) return lessonPath(course, module, onlyLesson);
  return moduleOverviewPath(course, module);
}
