"use client";

import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { enrollInCourse } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { courseFacts } from "@/lib/course-shelf/course-shelf";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** How many module thumbnails the strip shows before counting the rest. */
const SHOWN_MODULES = 4;

/** Props for {@link CourseShelfCard}. */
export type CourseShelfCardProps = {
  view: CourseForView;
};

/**
 * A course the learner has not joined, on Available courses' shelf: its first
 * video's artwork, a glance at its modules, its size, and **Enroll**.
 *
 * @remarks
 * **Enroll** enrolls through the learner store at once (capability
 * `course-enrollment`), so the page moves the course to the learner's courses
 * before the server answers, and back if it refuses. **Preview course** opens
 * the course page (`CourseDetailView`) without enrolling. The strip shows each module's first video,
 * up to four, and counts the rest.
 *
 * @example
 * ```tsx
 * <CourseShelfCard view={advancedCourseView} />
 * ```
 */
export function CourseShelfCard({ view }: CourseShelfCardProps) {
  const t = useTranslations("Components.CourseShelfCard");
  const runtimeLabel = useRuntimeLabel();
  const { course, standing } = view;
  const facts = courseFacts(view);

  return (
    <article
      data-testid="course-shelf-card"
      className="grid grid-cols-1 items-center gap-5 rounded-[22px] border border-border bg-card p-3.5 md:grid-cols-[16.25rem_minmax(0,1fr)_auto]"
    >
      <span className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-secondary">
        <Poster
          src={firstPosterOf(view, 0)}
          sizes="(min-width: 768px) 260px, 100vw"
        />
        <span className="absolute top-2.5 left-2.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {standing.kind === "level" ? t("level", { level: standing.number }) : t("reference")}
        </span>
      </span>
      <div className="flex min-w-0 flex-col gap-2.5">
        <h3 className="text-xl leading-tight font-black tracking-[-0.025em] text-foreground">
          {course.title}
        </h3>
        <ModuleStrip view={view} />
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t("facts", {
            modules: facts.moduleCount,
            videos: facts.videoCount,
            runtime: runtimeLabel(facts.runtimeSeconds),
          })}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => enrollInCourse(course.slug)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-primary px-5 text-[0.9375rem] font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter] hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Plus
            aria-hidden="true"
            className="size-4"
          />
          {t("enroll")}
        </button>
        <Link
          href={courseOverviewPath(course) as never}
          className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-border bg-card px-5 text-[0.9375rem] font-bold text-foreground transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("preview")}
        </Link>
      </div>
    </article>
  );
}

function ModuleStrip({ view }: { view: CourseForView }) {
  const shown = view.modules.slice(0, SHOWN_MODULES);
  const hiddenCount = view.modules.length - shown.length;

  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-5 gap-2"
    >
      {shown.map((courseModule, index) => (
        <span
          key={courseModule.id}
          data-testid="course-shelf-card-module"
          className="relative aspect-video overflow-hidden rounded-lg bg-secondary"
        >
          <Poster
            src={firstPosterOf(view, index)}
            sizes="80px"
            muted
          />
          <span className="absolute bottom-0.5 left-1.5 text-lg leading-none font-black text-transparent [-webkit-text-stroke:1px_var(--gold)]">
            {String(courseModule.sequence).padStart(2, "0")}
          </span>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="grid aspect-video place-items-center rounded-lg bg-secondary font-mono text-xs font-bold text-muted-foreground">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}

function Poster({
  src,
  sizes,
  muted = false,
}: {
  src: string | undefined;
  sizes: string;
  muted?: boolean;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      className={muted ? "object-cover brightness-75 saturate-[0.65]" : "object-cover"}
    />
  );
}

function firstPosterOf(view: CourseForView, moduleIndex: number): string | undefined {
  return view.moduleSummaries[moduleIndex]?.lessons[0]?.poster;
}
