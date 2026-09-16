import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import type { PrizeState } from "@/lib/learner-achievements/learner-achievements";
import type { PrizeId } from "@/lib/module-prizes/module-prizes";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

/** The hanging tag's paper per prize state: gold when claimed, ticket cream while collecting. */
const TAG_CLASSES: Record<PrizeState, string> = {
  claimed: "bg-primary text-primary-foreground",
  ready: "bg-primary text-primary-foreground",
  collecting: "prize-sway bg-ticket text-ticket-ink",
  locked: "bg-secondary text-muted-foreground",
};

/**
 * One module's prize on the counter shelf: the toy, its name once claimed, and
 * a hanging tag with the tickets collected — or the control that claims it.
 *
 * @remarks
 * Until every ticket of the module is earned, the prize is a silhouette and its
 * name is withheld — visibly `???` — so the counter keeps the surprise the
 * arcade counter has. Collecting every ticket does not open it either: the
 * learner claims the prize here, and only then is it revealed and named.
 *
 * Everything visible is decoration for assistive technology, which hears one
 * sentence carrying the whole state instead: the prize and that it is redeemed,
 * that the module's hidden prize is ready to claim, or how many tickets it has.
 * The states differ in shape and words as well as colour — silhouette versus
 * illustration, `???` versus a name, a control versus a tag.
 *
 * @example
 * ```tsx
 * <PrizeShelfItem prize="harmonica" moduleTitle="Vowels" moduleSlug="2-vowels" state="ready" ticketsEarned={17} ticketCount={17} onClaim={claim} />
 * ```
 *
 * @param prize - The module's prize
 * @param moduleTitle - The module's title, used while the prize is hidden
 * @param moduleSlug - The module's slug, which identifies the claim
 * @param state - Claimed, ready, collecting or locked
 * @param ticketsEarned - Tickets earned in the module
 * @param ticketCount - Lessons in the module
 * @param onClaim - Called with the module slug when the learner claims the prize
 * @param isCalled - Whether this is the prize the learner came for; the toy waves, while the item and
 *                   its Claim prize control stay put
 * @param motionOrder - The item's place in the shelf's entrance sequence, from 0
 */
export function PrizeShelfItem({
  prize,
  moduleTitle,
  moduleSlug,
  state,
  ticketsEarned,
  ticketCount,
  onClaim,
  isCalled = false,
  motionOrder,
}: {
  prize: PrizeId;
  moduleTitle: string;
  moduleSlug: string;
  state: PrizeState;
  ticketsEarned: number;
  ticketCount: number;
  onClaim?: (moduleSlug: string) => void;
  isCalled?: boolean;
  motionOrder?: number;
}) {
  const t = useTranslations("Components.PrizeShelfItem");
  const prizeNames = useTranslations("Components.PrizeIcon.names");
  const isClaimed = state === "claimed";
  const isReady = state === "ready";
  const prizeName = prizeNames(prize);
  const isSequenced = motionOrder !== undefined;

  return (
    <li
      data-prize-state={state}
      data-prize-slug={moduleSlug}
      data-called={isCalled ? "true" : undefined}
      tabIndex={-1}
      style={isSequenced ? ({ "--motion-order": motionOrder } as CSSProperties) : undefined}
      className={cn(
        "flex flex-col items-center rounded-xl outline-none",
        isSequenced && "achievement-rise",
      )}
    >
      <span className="sr-only">{stateSentence()}</span>
      <span
        aria-hidden="true"
        className="flex flex-col items-center gap-2.5"
      >
        <span
          className={cn(
            "flex h-[7.375rem] items-end",
            isClaimed && "prize-glow",
            isCalled && "prize-called",
          )}
        >
          <PrizeIcon
            prize={prize}
            locked={!isClaimed}
            size={104}
          />
        </span>
        <span
          className={cn(
            "text-center text-sm font-bold",
            isClaimed ? "text-foreground" : "tracking-[0.2em] text-muted-foreground",
          )}
        >
          {isClaimed ? prizeName : t("hiddenName")}
        </span>
      </span>
      {isReady ? (
        <button
          type="button"
          aria-label={t("claimLabel", { module: moduleTitle })}
          onClick={() => onClaim?.(moduleSlug)}
          className="prize-ready-pulse mt-0.5 inline-flex min-h-9 cursor-pointer items-center rounded-full bg-primary px-3.5 text-[11px] font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("claim")}
        </button>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "lesson-ticket px-3.5 py-1.5 text-[11px] font-extrabold tabular-nums",
            TAG_CLASSES[state],
          )}
        >
          {isClaimed ? t("redeemed") : t("tag", { earned: ticketsEarned, count: ticketCount })}
        </span>
      )}
    </li>
  );

  /** The whole state in one sentence, for assistive technology. */
  function stateSentence(): string {
    if (isClaimed) return t("redeemedLabel", { prize: prizeName });
    if (isReady) return t("readyLabel", { module: moduleTitle });
    return t("hiddenLabel", { module: moduleTitle, earned: ticketsEarned, count: ticketCount });
  }
}
