import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { PlayButton } from "@/components/play-button/play-button";
import { WatchProgressBar } from "@/components/watch-progress-bar/watch-progress-bar";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import { Link } from "@/i18n/navigation";
import type { RouteStepState } from "@/lib/module-route/module-route";
import { cn } from "@/lib/utils/utils";

import { Check, Play } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";

const SECONDS_PER_MINUTE = 60;
const PERCENT_MAX = 100;

const THUMB_GLOW =
  "radial-gradient(120% 120% at 30% 12%, color-mix(in oklab, var(--glow) 26%, var(--background)), var(--background) 72%)";

/**
 * Extends the step action's pointer target to the whole step without adding a
 * control: the box is the link's own `::after`, so the DOM, the accessibility
 * tree and the tab order are untouched.
 */
const STRETCHED_HIT_AREA = "after:absolute after:inset-0 after:z-10 after:content-['']";

const FOCUS_RING = "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/** Props for {@link ModuleRouteStep}. */
export type ModuleRouteStepProps = {
  /** The lesson this step stands for. */
  lesson: Lesson;
  /** The locale-less path of the lesson page. */
  href: string;
  /** Where the lesson sits on the learner's route. */
  state: RouteStepState;
  /** 0 to 1; how much of the lesson has been watched. */
  watchedFraction: number;
};

/**
 * One lesson on a module's route.
 *
 * @remarks
 * An **upcoming** step shows the lesson's thumbnail and invites watching it. A
 * **finished** step recedes — no thumbnail, a muted title, an offer to watch
 * again — and announces its state by name, so it never rests on the marker's
 * colour alone. The **current** step is featured as a card with the poster,
 * a "you are here" eyebrow and one primary action: continue when partly
 * watched, start when not.
 *
 * Each step draws its own piece of the rail: a marker for its state and the
 * connector below it, filled once the step is finished. Drawing the rail per
 * step keeps it aligned however tall a wrapped title or the card grows.
 *
 * Every form exposes one announced, tabbable link. Thumbnails and posters
 * repeat that destination for pointers only; the whole step is a pointer
 * target through the action's stretched `::after`.
 *
 * @example
 * ```tsx
 * <ModuleRouteStep lesson={lesson} href={lessonPath(course, module, lesson)} state="current" watchedFraction={0.4} />
 * ```
 *
 * @param props - {@link ModuleRouteStepProps}
 */
export function ModuleRouteStep({ lesson, href, state, watchedFraction }: ModuleRouteStepProps) {
  return (
    <div
      data-state={state}
      className="relative flex items-stretch gap-2 lg:gap-4"
    >
      <RouteRail state={state} />
      {state === "current" ? (
        <CurrentCard
          lesson={lesson}
          href={href}
          watchedFraction={watchedFraction}
        />
      ) : (
        <StepRow
          lesson={lesson}
          href={href}
          isFinished={state === "finished"}
        />
      )}
    </div>
  );
}

function RouteRail({ state }: { state: RouteStepState }) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center lg:w-16">
      <RouteMarker state={state} />
      <span
        data-testid="route-connector"
        data-filled={state === "finished"}
        aria-hidden="true"
        className={cn("mt-1 min-h-4 w-0.5 flex-1", state === "finished" ? "bg-gold" : "bg-border")}
      />
    </div>
  );
}

const MARKER_CLASS: Record<RouteStepState, string> = {
  finished: "mt-2.5 size-6 bg-gold text-[color:var(--primary-foreground)]",
  current:
    "size-9 border-2 border-gold bg-background text-gold shadow-[0_0_0_6px_color-mix(in_oklab,var(--glow)_12%,transparent),0_0_28px_color-mix(in_oklab,var(--glow)_45%,transparent)] lg:size-11",
  upcoming: "mt-3.5 size-[18px] border-2 border-foreground/20 bg-background",
};

function RouteMarker({ state }: { state: RouteStepState }) {
  return (
    <span
      data-testid="route-marker"
      data-marker={state}
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-full", MARKER_CLASS[state])}
    >
      {state === "finished" ? (
        <Check
          className="size-3.5"
          strokeWidth={3}
        />
      ) : null}
      {state === "current" ? (
        <Play
          className="size-3.5 lg:size-4"
          fill="currentColor"
        />
      ) : null}
    </span>
  );
}

function StepRow({
  lesson,
  href,
  isFinished,
}: {
  lesson: Lesson;
  href: string;
  isFinished: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3 rounded-lg pb-4 transition-colors hover:bg-foreground/5 lg:gap-4",
        isFinished ? "pt-1.5" : "pt-1",
      )}
    >
      {isFinished ? null : (
        <StepThumbnail
          lesson={lesson}
          href={href}
        />
      )}
      <StepHeading
        lesson={lesson}
        isFinished={isFinished}
      />
      <StepAction
        href={href}
        isFinished={isFinished}
      />
    </div>
  );
}

function durationMinutes(durationSeconds: number): number {
  return Math.max(1, Math.round(durationSeconds / SECONDS_PER_MINUTE));
}

function minutesLeft(lesson: Lesson, watchedFraction: number): number {
  const durationSeconds = lesson.kind === "video" ? lesson.durationSeconds : 0;
  return durationMinutes(durationSeconds * (1 - watchedFraction));
}

function CurrentCard({
  lesson,
  href,
  watchedFraction,
}: {
  lesson: Lesson;
  href: string;
  watchedFraction: number;
}) {
  const t = useTranslations("CourseCatalog.moduleOverview");
  const isStarted = watchedFraction > 0;

  return (
    <div className="mb-7 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gold/45 bg-card shadow-[0_30px_60px_-30px_color-mix(in_oklab,var(--glow)_35%,transparent)] lg:flex-row">
      <StepPoster
        lesson={lesson}
        href={href}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 lg:p-6">
        <Eyebrow className="text-[11px] tracking-[0.26em]">
          {t("youAreHere", { number: lesson.sequence })}
        </Eyebrow>
        <p className="text-lg font-bold text-pretty text-card-foreground lg:text-[22px] lg:leading-tight">
          {lesson.title}
        </p>
        {isStarted ? (
          <CurrentProgress
            lesson={lesson}
            watchedFraction={watchedFraction}
          />
        ) : null}
        <Link
          href={href as never}
          className={cn(
            "inline-flex min-h-12 items-center justify-center gap-2 self-stretch rounded-lg bg-gold px-5 text-sm font-bold text-[color:var(--primary-foreground)] shadow-[0_2px_20px_color-mix(in_oklab,var(--glow)_45%,transparent)] lg:min-h-11 lg:self-start",
            FOCUS_RING,
            STRETCHED_HIT_AREA,
          )}
        >
          <Play
            className="size-3.5"
            fill="currentColor"
          />
          {isStarted ? t("continue") : t("start")}
        </Link>
      </div>
    </div>
  );
}

function CurrentProgress({ lesson, watchedFraction }: { lesson: Lesson; watchedFraction: number }) {
  const t = useTranslations("CourseCatalog.moduleOverview");
  const tProgress = useTranslations("Components.LessonWatchProgress");
  const format = useFormatter();
  const percent = format.number(watchedFraction, { style: "percent" });

  return (
    <WatchProgressBar
      value={Math.round(watchedFraction * PERCENT_MAX)}
      max={PERCENT_MAX}
      label={t("minutesLeft", { minutes: minutesLeft(lesson, watchedFraction) })}
      ariaLabel={tProgress("ariaLabel", { percent })}
    />
  );
}

function StepPoster({ lesson, href }: { lesson: Lesson; href: string }) {
  const poster = lesson.kind === "video" ? lesson.poster : undefined;
  return (
    <Link
      href={href as never}
      aria-hidden="true"
      tabIndex={-1}
      className="relative flex aspect-video w-full shrink-0 items-center justify-center lg:w-[340px]"
      style={{ background: THUMB_GLOW }}
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 1024px) 340px, 100vw"
          className="object-cover"
        />
      ) : (
        <span data-testid="route-thumbnail-fallback">
          <PlayButton
            size="lg"
            decorative
          />
        </span>
      )}
    </Link>
  );
}

function StepThumbnail({ lesson, href }: { lesson: Lesson; href: string }) {
  const poster = lesson.kind === "video" ? lesson.poster : undefined;
  return (
    <Link
      href={href as never}
      aria-hidden="true"
      tabIndex={-1}
      className="relative flex aspect-video w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border sm:w-32"
      style={{ background: THUMB_GLOW }}
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="128px"
          className="object-cover"
        />
      ) : (
        <span data-testid="route-thumbnail-fallback">
          <PlayButton
            size="sm"
            decorative
          />
        </span>
      )}
    </Link>
  );
}

function StepHeading({ lesson, isFinished }: { lesson: Lesson; isFinished: boolean }) {
  const t = useTranslations("CourseCatalog.moduleOverview");
  const tCompletion = useTranslations("Components.LessonCompletion");
  const ordinal = t("videoOrdinal", { number: lesson.sequence });
  const eyebrow =
    lesson.kind === "video"
      ? `${ordinal} · ${t("duration", { minutes: durationMinutes(lesson.durationSeconds) })}`
      : ordinal;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-bold tracking-[0.22em] text-muted-foreground uppercase lg:text-[11px]">
        {eyebrow}
      </span>
      <span
        className={cn(
          "text-pretty",
          isFinished
            ? "text-sm font-medium text-muted-foreground lg:text-[15px]"
            : "text-[15px] font-semibold text-foreground lg:text-[17px]",
        )}
      >
        {lesson.title}
      </span>
      {isFinished ? <span className="sr-only">{tCompletion("completed")}</span> : null}
    </div>
  );
}

/**
 * On a phone the step's action has no visible box: a button beside the
 * thumbnail squeezed titles to a word per line. The link stays — its label
 * is visually hidden and its stretched overlay still makes the whole step the
 * target. The label is hidden rather than the link, because `sr-only` on the
 * link would clip the `::after` that carries the click. Focus is drawn on that
 * overlay, since the link's own box is empty there.
 */
const PHONE_COMPACT_ACTION =
  "max-sm:after:rounded-lg max-sm:focus-visible:after:ring-3 max-sm:focus-visible:after:ring-ring/50";

function StepAction({ href, isFinished }: { href: string; isFinished: boolean }) {
  const t = useTranslations("CourseCatalog.moduleOverview");

  if (isFinished) {
    return (
      <Link
        href={href as never}
        className={cn(
          "inline-flex shrink-0 items-center rounded-lg text-sm font-semibold text-muted-foreground transition-colors hover:text-gold sm:min-h-11 sm:px-3",
          FOCUS_RING,
          STRETCHED_HIT_AREA,
          PHONE_COMPACT_ACTION,
        )}
      >
        <span className="max-sm:sr-only">{t("watchAgain")}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href as never}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg text-sm font-semibold text-card-foreground transition-colors hover:text-gold sm:min-h-11 sm:border sm:border-border sm:bg-card sm:px-4 sm:hover:border-gold/50",
        FOCUS_RING,
        STRETCHED_HIT_AREA,
        PHONE_COMPACT_ACTION,
      )}
    >
      <Play
        className="size-3.5 max-sm:hidden"
        fill="currentColor"
      />
      <span className="max-sm:sr-only">{t("watchVideo")}</span>
    </Link>
  );
}
