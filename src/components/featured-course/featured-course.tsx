import { GoldBadge } from "@/components/gold-badge/gold-badge";
import { PosterCard } from "@/components/poster-card/poster-card";
import type { Course } from "@/domain/entities/course/course";
import { Link } from "@/i18n/navigation";

/**
 * The featured-course rail on the home page. A "Courses · Featured" pill, a
 * feature poster, the course title/description, a counts badge, and a
 * compact numbered module index (01–N). Purely presentational — the page
 * resolves the real course + counts string and passes them in.
 */
export function FeaturedCourse({
  course,
  href,
  posterUrl,
  featuredLabel,
  featureLabel,
  featureHeadline,
  countsLabel,
}: {
  course: Course;
  href: string;
  posterUrl?: string | null;
  featuredLabel: string;
  featureLabel: string;
  featureHeadline: string;
  countsLabel: string;
}) {
  const modules = Array.from({ length: course.moduleCount }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  return (
    <section
      aria-label={featuredLabel}
      className="flex w-full max-w-md flex-col gap-4"
      data-testid="featured-course"
    >
      <GoldBadge className="w-fit">{featuredLabel}</GoldBadge>
      <Link
        href={href as never}
        aria-label={course.title}
        className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <PosterCard
          title={course.title}
          eyebrow={featureLabel}
          headline={posterUrl ? undefined : featureHeadline}
          posterUrl={posterUrl}
          posterAlt={course.title}
          priority
          framed={false}
          showMeta={false}
          aspect="video"
        />
      </Link>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{course.title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
      </div>
      <GoldBadge className="w-fit">{countsLabel}</GoldBadge>
      <ol
        className="flex flex-wrap gap-1.5"
        aria-hidden="true"
      >
        {modules.map((n) => (
          <li
            key={n}
            className="flex size-8 items-center justify-center rounded-md border border-border bg-foreground/5 text-[11px] font-bold text-muted-foreground tabular-nums"
          >
            {n}
          </li>
        ))}
      </ol>
    </section>
  );
}
