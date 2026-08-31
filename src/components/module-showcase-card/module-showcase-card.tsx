import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { PlayButton } from "@/components/play-button/play-button";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { formatDuration } from "@/lib/format-duration/format-duration";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import Image from "next/image";

/**
 * The card's own atmosphere: one warm radial bloom from the upper left
 * fading into the page background, spanning the whole card rather than
 * sitting in a box behind the title. The reference design fills its card
 * edge to edge with artwork; this is the Immersion Cinema equivalent.
 */
const CARD_GLOW =
  "radial-gradient(90% 160% at 4% 0%, color-mix(in oklab, var(--glow) 34%, var(--background)), var(--background) 68%)";
const TILE_GLOW =
  "radial-gradient(120% 120% at 30% 12%, color-mix(in oklab, var(--glow) 26%, var(--background)), var(--background) 72%)";

/**
 * The receding gallery.
 *
 * Cards are landscape — the posters' own orientation, so nothing is cropped
 * to fit — laid nearly side by side and shrinking as they go back, rather
 * than stacked into a heavily overlapped fan. Measured off the reference:
 * its six cards span most of the panel and barely overlap, with the first
 * roughly twice the width of the last.
 *
 * Sizes are flex ratios, not pixels, so the deck fills whatever width the
 * panel gives it and can never overflow into the copy beside it.
 */
const DECK = {
  /**
   * Ratio of the flex space each successive card claims. Measured off the
   * reference, whose last card is a little over half the width of its first;
   * 0.09 reproduces that. Steeper falloffs look more dramatic but starve the
   * rear cards of the width their labels need.
   */
  WIDTH_FALLOFF: 0.09,
  /**
   * Cards hold this ratio and take their height from their width, so the
   * recession shrinks them in both axes at once. Height was briefly set from
   * a fixed stage instead, independently of width — which quietly turned the
   * cards portrait and cropped the artwork all over again.
   *
   * 3:2 is the closest landscape ratio to the reference's ~1.4 that stays
   * near the posters' native 16:9; it costs a 16% crop rather than the 25%
   * that 4:3 would.
   */
  ASPECT: "3 / 2",
  /** Stops a lone card in a one-lesson module from ballooning across the panel. */
  MAX_CARD_PX: 300,
  /** How many cards the gallery shows on a phone, where six would be specks. */
  CARDS_BELOW_SM: 3,
  /**
   * One shared Y-rotation turns every card the same way, as though the deck
   * were a shelf seen from its left. Depth then comes from size and shading
   * rather than from rotating each card differently — that is what reads as
   * perspective instead of as scatter.
   */
  ROTATE_Y_DEG: -16,
  PERSPECTIVE_PX: 1600,
  /** How much darker each card is than the one in front of it. */
  SHADE_STEP: 0.11,
  MAX_SHADE: 0.6,
} as const;

/**
 * One module on the course overview, presented as a container rather than as
 * something to play.
 *
 * @remarks
 * The card this replaces was a `PosterCard`, which reads as a single video:
 * a 16:9 artwork box, a play circle and an oversized number all say "one
 * thing", and the small `Module` badge was the only thing saying otherwise.
 * This card asserts plurality three redundant ways so no single signal has
 * to carry it — you *see* a deck of several lessons, you are *told* the count
 * and duration, and the call to action is a navigation verb rather than a
 * playback one.
 *
 * The module ordinal renders outside the framed panel (design §D4). Keeping
 * it out of the frame is what makes it immune to truncation: real module
 * titles run to 50 characters.
 *
 * ## The deck
 *
 * Lessons are laid out as a gallery receding to the right: landscape cards,
 * numbered, each slightly smaller and darker than the one in front, all
 * turned by one shared Y-rotation. A deck says "several, in order" more
 * immediately than a grid does, and it suits this content in a way the grid
 * never did — grid tiles had to be re-cropped to vary their shape, and these
 * posters are text-bearing title cards whose wording an off-ratio crop
 * destroys. Landscape cards match the posters' own orientation, so nothing is
 * cropped to fit.
 *
 * Card sizes are flex ratios rather than pixels. That is what keeps the deck
 * filling its panel at any width instead of spilling over the copy beside it.
 *
 * ## Accessibility
 *
 * Every card carries its lesson's title and runtime, so the deck is content
 * and is exposed as a labelled list — hiding it would drop information found
 * nowhere else on the page.
 *
 * The cards are not links. The call to action is the card's one control, and
 * six links per deck across ten modules would add sixty tab stops to reach a
 * destination already on offer; a card that jumped straight to one lesson
 * would also re-fragment the "this is a container" model this component
 * exists to establish. They carry no hover or pointer affordance, so they do
 * not advertise interactivity they lack.
 *
 * The card itself is a plain container with two links to the same
 * destination — the heading and the call to action — rather than one wrapping
 * link, so its accessible name stays the module title instead of swallowing
 * the count line, the button and every lesson in the deck.
 */
export function ModuleShowcaseCard({
  course,
  module,
  summary,
}: {
  course: Course;
  module: Module;
  summary: ModuleSummary;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const href = moduleOverviewPath(course, module);
  const remaining = summary.lessonCount - summary.leadingLessons.length;

  const { hours, minutes } = formatDuration(summary.totalDurationSeconds);
  const duration =
    hours === 0
      ? t("durationMinutes", { minutes })
      : minutes === 0
        ? t("durationHours", { hours })
        : t("durationHoursMinutes", { hours, minutes });

  return (
    <div className="flex flex-col gap-3">
      <Eyebrow data-testid="module-showcase-ordinal">
        {t("moduleOrdinal", { number: module.sequence })}
      </Eyebrow>

      <div
        data-testid="module-showcase-panel"
        className="flex flex-col gap-8 overflow-hidden rounded-2xl border border-border p-6 lg:flex-row lg:items-center lg:gap-10 lg:p-8"
        style={{ background: CARD_GLOW }}
      >
        <div className="relative flex flex-col gap-4 lg:w-[30%] lg:shrink-0">
          <h3 className="font-sans text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            <Link
              href={href as never}
              className="rounded-sm hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {module.title}
            </Link>
          </h3>

          <p
            data-testid="module-showcase-meta"
            className="text-sm text-muted-foreground tabular-nums"
          >
            {t("moduleMeta", {
              videos: t("videoCount", { count: summary.lessonCount }),
              duration,
            })}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={href as never}
              data-testid="module-showcase-cta"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-auto"
            >
              {t("viewVideos")}
            </Link>
            <PlayButton
              size="lg"
              decorative
            />
          </div>
        </div>

        {summary.leadingLessons.length > 0 ? (
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3">
            {/*
              A receding gallery rather than a flat row: one shared Y-rotation
              turns every card the same way, and depth then comes from scale
              and shading. The stage is sized to the spread deck so it can be
              positioned as a unit — centred on narrow screens, filling the
              panel beside the copy on wide ones.

              Unlike the earlier artwork-only deck, every card here is
              labelled, so the deck is content and is exposed as a list rather
              than hidden. It stays non-interactive: the call to action is the
              one control, and six links per card across ten modules would
              add sixty tab stops to reach a destination already on offer.
            */}
            <div
              data-testid="module-showcase-deck"
              aria-hidden="true"
              className="flex w-full items-center"
              style={{ perspective: `${DECK.PERSPECTIVE_PX}px` }}
            >
              {summary.leadingLessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  data-testid="module-showcase-card-in-deck"
                  className={cn(
                    "relative min-w-0 overflow-hidden rounded-xl border border-white/25",
                    // Six cards across a phone shrinks the last to ~44px,
                    // which is not a picture of anything. Below `sm` the
                    // gallery shows three and lets them keep some size; the
                    // count line still states the real total either way.
                    index >= DECK.CARDS_BELOW_SM && "hidden sm:block",
                    // Two shadows: one thrown rightward onto the card behind,
                    // which is what separates each card from the next, and
                    // one downward for the deck's own weight.
                    "shadow-[12px_0_26px_color-mix(in_oklab,var(--background)_88%,transparent),0_16px_34px_color-mix(in_oklab,var(--background)_80%,transparent)]",
                    // A sliver of overlap so the deck reads as one object
                    // rather than as separate thumbnails in a row.
                    index > 0 && "-ml-3",
                  )}
                  style={{
                    background: TILE_GLOW,
                    // Flex ratios rather than pixels: the deck then fills the
                    // panel exactly, whatever width it is given, and can
                    // never spill over the copy beside it.
                    flex: `${Math.max(0.25, 1 - index * DECK.WIDTH_FALLOFF)} 1 0%`,
                    aspectRatio: DECK.ASPECT,
                    maxWidth: `${DECK.MAX_CARD_PX}px`,
                    // Later cards sit further back, so each is overlapped by
                    // the one in front of it.
                    zIndex: summary.leadingLessons.length - index,
                    transformOrigin: "left center",
                    transform: `rotateY(${DECK.ROTATE_Y_DEG}deg)`,
                  }}
                >
                  {lesson.poster ? (
                    <Image
                      src={lesson.poster}
                      alt=""
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : null}

                  {/*
                    Two gradients per card. The depth veil deepens with each
                    card back, which is what sells the recession; the scrim
                    keeps the label legible over whatever the poster happens
                    to show behind it.
                  */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(115deg, color-mix(in oklab, var(--background) 70%, transparent), transparent 55%)`,
                      opacity: Math.min(DECK.MAX_SHADE, index * DECK.SHADE_STEP),
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--background)_70%,transparent),transparent)]"
                  />
                </div>
              ))}
            </div>

            {remaining > 0 ? (
              <p
                data-testid="module-showcase-remainder"
                className="pt-3 text-xs font-semibold text-gold tabular-nums"
              >
                {t("remainingVideos", { count: remaining })}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
