import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import type { Module } from "@/domain/entities/module/module";
import type { ModulePrizeDetails } from "@/hooks/use-module-prize/use-module-prize";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

import { ArrowRight, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** Where the prize is drawn on the module overview. */
export type ModulePrizeLayout = "panel" | "finale";

const THUMB_GLOW =
  "radial-gradient(120% 120% at 30% 12%, color-mix(in oklab, var(--glow) 26%, var(--background)), var(--background) 72%)";

/** The lesson (module) a finished module hands the learner on to. */
export type NextLessonLink = {
  /** The next lesson's ordinal in its course. */
  sequence: number;
  /** The locale-less path that opens it — see `moduleEntryPath`. */
  href: string;
};

/** Props for {@link ModulePrize}. */
export type ModulePrizeProps = {
  /** The module whose prize this is; names the prize while it is hidden. */
  module: Module;
  /** The module's prize reading, from `useModulePrize`. */
  prize: ModulePrizeDetails;
  /** Whether the learner's progress has been read; until then no state is asserted. */
  isRead: boolean;
  /**
   * `panel` — a row under the progress panel's figures. `finale` — the end of
   * the route: a marker on the rail and a card, featured once every ticket is in.
   */
  layout: ModulePrizeLayout;
  /**
   * The course's next lesson, offered by the finale once every ticket is in.
   * Absent for the course's last lesson.
   */
  nextLesson?: NextLessonLink;
};

/**
 * A module's prize on the module overview, drawn the way the prize counter
 * draws it.
 *
 * @remarks
 * The counter keeps a prize a surprise until the learner claims it there, so
 * this does too: a silhouette named `???` in every state but claimed, with the
 * tickets collected while it is still being earned. Only a claimed prize is
 * shown in colour and named.
 *
 * The visible pieces are decoration for assistive technology, which hears the
 * counter's own one-sentence state instead. Before progress is read, the panel
 * row keeps its place with its label, the silhouette and `???` alone, and the
 * finale — below every step, where nothing can jump — is not drawn at all.
 *
 * The finale is deliberately not a step: it sits after the route's list,
 * carries no step state, and its marker tells a prize still collecting (a
 * dashed ring) from one with every ticket in (a solid disc) by shape. Once
 * every ticket is in, its primary action hands the learner on to the next
 * lesson; claiming stays a secondary text link.
 *
 * @example
 * ```tsx
 * <ModulePrize module={module} prize={prize} isRead={reading.isRead} layout="panel" />
 * <ModulePrize module={module} prize={prize} isRead={reading.isRead} layout="finale" />
 * ```
 *
 * @param props - {@link ModulePrizeProps}
 */
export function ModulePrize({ module, prize, isRead, layout, nextLesson }: ModulePrizeProps) {
  if (layout === "finale") {
    return isRead ? (
      <PrizeFinale
        module={module}
        prize={prize}
        nextLesson={nextLesson}
      />
    ) : null;
  }
  return (
    <PrizePanelRow
      module={module}
      prize={prize}
      isRead={isRead}
    />
  );
}

function PrizePanelRow({
  module,
  prize,
  isRead,
}: Pick<ModulePrizeProps, "module" | "prize" | "isRead">) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 lg:pt-5">
      <div className="flex items-center gap-3">
        <PrizeArt
          prize={prize}
          isRead={isRead}
          size={56}
        />
        {isRead ? (
          <PrizeStateSentence
            module={module}
            prize={prize}
          />
        ) : null}
        <PrizeCopy
          prize={prize}
          isRead={isRead}
          headingAction={
            isRead && prize.state === "ready" ? <ClaimPrizeLink module={module} /> : null
          }
        />
      </div>
    </div>
  );
}

function PrizeFinale({ module, prize, nextLesson }: Omit<ModulePrizeProps, "layout" | "isRead">) {
  const isCollected = prize.state === "ready" || prize.state === "claimed";

  return (
    <div
      data-testid="module-prize-finale"
      className="relative flex items-start gap-2 lg:gap-4"
    >
      <div className="flex w-11 shrink-0 justify-center lg:w-16">
        <FinaleMarker isCollected={isCollected} />
      </div>
      <PrizeStateSentence
        module={module}
        prize={prize}
      />
      {isCollected ? (
        <FeaturedFinaleCard
          module={module}
          prize={prize}
          nextLesson={nextLesson}
        />
      ) : (
        <SubordinateFinaleCard prize={prize} />
      )}
    </div>
  );
}

function FinaleMarker({ isCollected }: { isCollected: boolean }) {
  return (
    <span
      data-testid="module-prize-marker"
      data-marker={isCollected ? "collected" : "collecting"}
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full lg:size-11",
        isCollected
          ? "bg-gold text-[color:var(--primary-foreground)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--glow)_12%,transparent),0_0_28px_color-mix(in_oklab,var(--glow)_45%,transparent)]"
          : "border-2 border-dashed border-foreground/25 bg-background text-muted-foreground",
      )}
    >
      <Trophy className="size-4 lg:size-[18px]" />
    </span>
  );
}

function SubordinateFinaleCard({ prize }: { prize: ModulePrizeDetails }) {
  return (
    <div
      data-testid="module-prize-card"
      data-featured="false"
      className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-dashed border-foreground/20 p-4 lg:gap-5 lg:p-6"
    >
      <PrizeArt
        prize={prize}
        isRead
        size={64}
      />
      <PrizeCopy
        prize={prize}
        isRead
      />
    </div>
  );
}

function FeaturedFinaleCard({
  module,
  prize,
  nextLesson,
}: Omit<ModulePrizeProps, "layout" | "isRead">) {
  return (
    <div
      data-testid="module-prize-card"
      data-featured="true"
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gold/45 bg-card shadow-[0_30px_60px_-30px_color-mix(in_oklab,var(--glow)_35%,transparent)] lg:flex-row"
    >
      <div
        className="flex min-h-40 w-full shrink-0 items-center justify-center lg:min-h-48 lg:w-[340px]"
        style={{ background: THUMB_GLOW }}
      >
        <PrizeArt
          prize={prize}
          isRead
          size={112}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-4 lg:p-6">
        <PrizeCopy
          prize={prize}
          isRead
          headingAction={prize.state === "ready" ? <ClaimPrizeLink module={module} /> : null}
        />
        {nextLesson ? <StartNextLessonLink nextLesson={nextLesson} /> : null}
      </div>
    </div>
  );
}

function PrizeArt({
  prize,
  isRead,
  size,
}: {
  prize: ModulePrizeDetails;
  isRead: boolean;
  size: number;
}) {
  const isRevealed = isRead && prize.state === "claimed";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn("flex shrink-0 items-center justify-center", isRevealed && "prize-glow")}
    >
      <PrizeIcon
        prize={prize.prize}
        locked={!isRevealed}
        size={size}
      />
    </span>
  );
}

/** The finale's primary action: on to the course's next lesson. */
function StartNextLessonLink({ nextLesson }: { nextLesson: NextLessonLink }) {
  const t = useTranslations("Components.ModulePrize");

  return (
    <Link
      href={nextLesson.href as never}
      className="inline-flex min-h-12 items-center justify-center gap-2 self-stretch rounded-lg bg-gold px-5 text-sm font-bold whitespace-nowrap text-[color:var(--primary-foreground)] shadow-[0_2px_20px_color-mix(in_oklab,var(--glow)_45%,transparent)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:min-h-11 lg:self-start"
    >
      {t("startNextLesson", { number: String(nextLesson.sequence).padStart(2, "0") })}
      <ArrowRight
        aria-hidden="true"
        className="size-4"
      />
    </Link>
  );
}

/**
 * The link's box is just its text, so it shares the label's baseline; the
 * `::after` extends the pointer target to 44px tall without moving the line.
 */
const CLAIM_LINK_CLASS =
  "relative shrink-0 text-[13px] leading-5 whitespace-nowrap text-muted-foreground underline underline-offset-4 transition-colors after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * Leads to the counter asking for this module's prize — the same destination
 * the prize-ready dialog opens. Claiming, and the reveal, stay on the counter.
 * A secondary text link, like the lesson page's Unmark: the claim is a detour,
 * never the page's main action.
 */
function ClaimPrizeLink({ module }: { module: Module }) {
  const shelf = useTranslations("Components.PrizeShelfItem");

  return (
    <Link
      href={`/achievements?claim=${module.slug}`}
      aria-label={shelf("claimLabel", { module: module.title })}
      className={CLAIM_LINK_CLASS}
    >
      {shelf("claim")}
    </Link>
  );
}

/**
 * The prize's label, name, tag and state line. They are decoration for assistive
 * technology — the state sentence says it all — so each is hidden, while a
 * `headingAction` on the label's line stays reachable.
 */
function PrizeCopy({
  prize,
  isRead,
  headingAction,
}: {
  prize: ModulePrizeDetails;
  isRead: boolean;
  headingAction?: ReactNode;
}) {
  const t = useTranslations("Components.ModulePrize");

  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span
        data-testid="module-prize-heading"
        className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"
      >
        <span
          aria-hidden="true"
          className="whitespace-nowrap"
        >
          <Eyebrow
            as="span"
            className="text-[10px] tracking-[0.28em]"
          >
            {isRead ? t(EYEBROW_KEY[prize.state]) : t("eyebrow")}
          </Eyebrow>
        </span>
        {headingAction}
      </span>
      <span
        aria-hidden="true"
        className="flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        <PrizeName
          prize={prize}
          isRead={isRead}
        />
        {isRead ? <PrizeTag prize={prize} /> : null}
      </span>
      <span
        aria-hidden="true"
        className="min-h-5 text-[13px] text-muted-foreground"
      >
        {isRead ? <PrizeLine prize={prize} /> : null}
      </span>
    </span>
  );
}

const EYEBROW_KEY = {
  locked: "eyebrow",
  collecting: "eyebrow",
  ready: "readyEyebrow",
  claimed: "claimedEyebrow",
} as const;

function PrizeName({ prize, isRead }: { prize: ModulePrizeDetails; isRead: boolean }) {
  const shelf = useTranslations("Components.PrizeShelfItem");
  const prizeNames = useTranslations("Components.PrizeIcon.names");

  if (isRead && prize.state === "claimed") {
    return (
      <span className="text-[17px] font-bold text-foreground lg:text-lg">
        {prizeNames(prize.prize)}
      </span>
    );
  }
  return (
    <span className="text-[17px] font-bold tracking-[0.2em] text-muted-foreground lg:text-lg">
      {shelf("hiddenName")}
    </span>
  );
}

function PrizeTag({ prize }: { prize: ModulePrizeDetails }) {
  const shelf = useTranslations("Components.PrizeShelfItem");

  if (prize.state === "ready") return null;
  const isClaimed = prize.state === "claimed";
  return (
    <span
      className={cn(
        "lesson-ticket px-3 py-1 text-[11px] font-extrabold tabular-nums",
        isClaimed ? "bg-primary text-primary-foreground" : "bg-ticket text-ticket-ink",
      )}
    >
      {isClaimed
        ? shelf("redeemed")
        : shelf("tag", { earned: prize.ticketsEarned, count: prize.ticketCount })}
    </span>
  );
}

function PrizeLine({ prize }: { prize: ModulePrizeDetails }) {
  const t = useTranslations("Components.ModulePrize");

  if (prize.state === "claimed") return null;
  if (prize.state === "ready") return t("allTickets", { count: prize.ticketCount });
  return t("ticketsLeft", { count: prize.ticketCount - prize.ticketsEarned });
}

function PrizeStateSentence({ module, prize }: { module: Module; prize: ModulePrizeDetails }) {
  const shelf = useTranslations("Components.PrizeShelfItem");
  const prizeNames = useTranslations("Components.PrizeIcon.names");

  return <span className="sr-only">{sentence()}</span>;

  function sentence(): string {
    if (prize.state === "claimed")
      return shelf("redeemedLabel", { prize: prizeNames(prize.prize) });
    if (prize.state === "ready") return shelf("readyLabel", { module: module.title });
    return shelf("hiddenLabel", {
      module: module.title,
      earned: prize.ticketsEarned,
      count: prize.ticketCount,
    });
  }
}
