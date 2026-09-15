import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import Image from "next/image";

/** How many lessons' artwork a poster stacks into its collage. */
const COLLAGE_SIZE = 3;

const PLACEHOLDER_GLOW =
  "radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, var(--glow) 30%, var(--background)), var(--background) 72%)";

/**
 * One module drawn as a portrait cinema poster: a collage of its first lessons'
 * artwork, an outlined ordinal, its title, and its videos with their runtime.
 *
 * @remarks
 * The poster fills whatever box its parent gives it, so the carousel sizes and
 * fades it by position without the poster knowing. `featured` enlarges the
 * type for the selected poster.
 *
 * Up to three lessons' posters are stacked top to bottom; a module holding one
 * lesson shows that single image, and a module with no artwork at all shows a
 * decorative warm placeholder. All artwork is `alt=""` — the title names the
 * module.
 *
 * @example
 * ```tsx
 * <ModulePoster
 *   sequence={module.sequence}
 *   title={module.title}
 *   lessons={summary.lessons}
 *   totalDurationSeconds={summary.totalDurationSeconds}
 *   featured
 * />
 * ```
 *
 * @param props.sequence - The module's position in the course, shown as the ordinal
 * @param props.title - The module's title
 * @param props.lessons - Every lesson of the module, in sequence order
 * @param props.totalDurationSeconds - The module's combined runtime
 * @param props.featured - Whether this is the selected poster
 */
export function ModulePoster({
  sequence,
  title,
  lessons,
  totalDurationSeconds,
  featured = false,
}: {
  sequence: number;
  title: string;
  lessons: ReadonlyArray<ModuleLesson>;
  totalDurationSeconds: number;
  featured?: boolean;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();
  const artwork = lessons
    .slice(0, COLLAGE_SIZE)
    .map((lesson) => lesson.poster)
    .filter((poster): poster is string => poster !== undefined);

  return (
    <div
      data-testid="module-poster"
      className="relative size-full overflow-hidden bg-card"
    >
      <PosterArtwork artwork={artwork} />
      <div className="absolute inset-0 bg-linear-to-t from-background from-25% via-background/40 to-transparent to-75%" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-3 left-4 leading-none font-black text-transparent [-webkit-text-stroke:1.5px_var(--gold)]",
          featured ? "text-6xl" : "text-4xl",
        )}
      >
        {String(sequence).padStart(2, "0")}
      </span>
      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-1.5">
        <span
          className={cn(
            "leading-[1.1] font-black tracking-tight text-balance text-foreground",
            featured ? "text-3xl" : "text-lg",
          )}
        >
          {title}
        </span>
        <span className={cn("text-gold tabular-nums", featured ? "text-sm" : "text-xs")}>
          {t("courseMetaShort", {
            videos: t("videoCount", { count: lessons.length }),
            duration: runtimeLabel(totalDurationSeconds),
          })}
        </span>
      </div>
    </div>
  );
}

function PosterArtwork({ artwork }: { artwork: ReadonlyArray<string> }) {
  if (artwork.length === 0) {
    return (
      <span
        data-testid="module-poster-placeholder"
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: PLACEHOLDER_GLOW }}
      />
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col gap-0.5">
      {artwork.map((poster) => (
        <div
          key={poster}
          className="relative min-h-0 flex-1"
        >
          <Image
            src={poster}
            alt=""
            fill
            sizes="300px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
