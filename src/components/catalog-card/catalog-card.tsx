import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { courseDetailPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { courseFacts, courseFirstVideo } from "@/lib/course-shelf/course-shelf";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** Props for {@link CatalogCard}. */
export type CatalogCardProps = {
  /** How many courses the catalog holds. */
  courseCount: number;
  /** How many of them the learner has not joined; `0` says they are in every one. */
  notJoinedCount: number;
  /** A course the learner has not joined, shown as a glimpse of the catalog; omitted when none is left. */
  teaser?: CourseForView;
};

/**
 * The way from My learning to Available courses: the size of the catalog, how
 * much of it the learner has not joined, and one course they could try next.
 *
 * @remarks
 * The card opens `/courses` from anywhere on it: its heading carries the link
 * and stretches it over the card, and the **See all courses** call to action is
 * drawn inside that area rather than being a second link. The teaser sits above
 * the stretched link and opens the teased course's own page
 * (`/courses/<slug>/about`), which shows the course to a learner who has not
 * joined it. It shows the course's first video, its Level N or Reference label
 * and its video count, so exploring starts from a real course rather than an
 * empty link. It closes the grid of Your courses on My learning.
 *
 * @example
 * ```tsx
 * <CatalogCard courseCount={3} notJoinedCount={1} teaser={advancedCourseView} />
 * ```
 */
export function CatalogCard({ courseCount, notJoinedCount, teaser }: CatalogCardProps) {
  const t = useTranslations("Components.CatalogCard");

  return (
    <article
      data-testid="catalog-card"
      className="group relative flex flex-col gap-3 rounded-[22px] border border-[color-mix(in_oklab,var(--gold)_55%,var(--border))] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--glow)_32%,var(--card)),var(--card)_75%)] p-5.5 text-foreground has-[h3_a:focus-visible]:ring-3 has-[h3_a:focus-visible]:ring-ring/50"
    >
      <Eyebrow as="span">{t("eyebrow", { count: courseCount })}</Eyebrow>
      <h3 className="text-[1.375rem] leading-[1.05] font-black tracking-[-0.03em]">
        <Link
          href="/courses"
          className="after:absolute after:inset-0 after:rounded-[22px] after:content-[''] focus-visible:outline-none"
        >
          {t("heading")}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground">{t("notJoined", { count: notJoinedCount })}</p>
      {teaser ? <CourseTeaser view={teaser} /> : null}
      <span className="pointer-events-none mt-auto inline-flex min-h-13 items-center gap-2.5 self-start rounded-[14px] bg-primary px-5.5 text-[0.9375rem] font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter,transform] group-hover:-translate-y-px group-hover:brightness-105 motion-reduce:transition-none">
        {t("cta")}
        <ArrowRight
          aria-hidden="true"
          className="size-4"
        />
      </span>
    </article>
  );
}

function CourseTeaser({ view }: { view: CourseForView }) {
  const t = useTranslations("Components.CatalogCard");
  const { standing } = view;
  const poster = courseFirstVideo(view)?.lesson.poster;
  const { videoCount } = courseFacts(view);

  return (
    <Link
      href={courseDetailPath(view.course) as never}
      data-testid="catalog-card-teaser"
      className="relative z-10 grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-border bg-card/70 p-2.5 transition-colors hover:border-gold/55 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="relative size-11 overflow-hidden rounded-lg bg-secondary"
      >
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold tracking-[-0.01em]">{view.course.title}</span>
        <span className="text-xs text-muted-foreground">
          {standing.kind === "level"
            ? t("levelFacts", { level: standing.number, count: videoCount })
            : t("referenceFacts", { count: videoCount })}
        </span>
      </span>
    </Link>
  );
}
