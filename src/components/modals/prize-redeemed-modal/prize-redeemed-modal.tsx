"use client";

import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";
import { Link } from "@/i18n/navigation";
import type { PrizeId } from "@/lib/module-prizes/module-prizes";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";

/** The widest the incoming tickets fan out, in px, however many there are. */
const FEED_SPREAD_PX = 360;
/** The longest the tickets take to set off one after another, in ms. */
const FEED_STAGGER_MS = 600;

/**
 * What the dialog celebrates: which prize, whose tickets, and how many — and
 * where the learner goes on from here.
 *
 * `continueHref` is the lesson the counter says they left off in, or `null`
 * when there is nowhere to continue, which offers closing alone.
 */
export type PrizeRedeemedModalProps = {
  prize: PrizeId;
  moduleTitle: string;
  ticketCount: number;
  continueHref?: string | null;
};

/**
 * Celebrates redeeming a module's prize: the module's tickets fly into the
 * prize's silhouette, it shakes and flashes, and the coloured prize appears
 * with its name.
 *
 * @remarks
 * Shown imperatively with `NiceModal.show(PrizeRedeemedModal, props)` by the
 * prize counter when the learner claims a prize. It offers two ways out:
 * closing leaves the learner on the counter, where the toy now sits in colour,
 * and continuing hands them back to the course where they left off — the
 * moment they are likeliest to start the next lesson. Closing stays the primary
 * control. Its promise settles with `undefined` on every way out, and closing
 * returns focus to the prize that was revealed.
 *
 * The whole sequence is decoration. The dialog is named after the prize and
 * described by the module and ticket count from the first frame, the "redeeming"
 * line is hidden from assistive technology, and every animated layer rests on
 * the revealed state — which is what reduced motion shows at once.
 *
 * @example
 * ```ts
 * void NiceModal.show(PrizeRedeemedModal, { prize: "harmonica", moduleTitle: "Vowels", ticketCount: 17 });
 * ```
 *
 * @category Components
 */
export const PrizeRedeemedModal = NiceModal.create(function PrizeRedeemedModal({
  prize,
  moduleTitle,
  ticketCount,
  continueHref,
}: PrizeRedeemedModalProps) {
  const modal = useModal();
  const t = useTranslations("Components.PrizeRedeemedModal");
  const prizeNames = useTranslations("Components.PrizeIcon.names");
  // Read on the first render, before the dialog takes focus.
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );

  const close = () => {
    modal.resolve();
    modal.hide();
  };
  const returnFocusToOpener = (event: Event) => {
    if (!(opener instanceof HTMLElement)) return;
    event.preventDefault();
    opener.focus();
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <DialogContent
        className="max-w-md gap-5 overflow-hidden border-primary/45 px-8 pt-9 pb-8 text-center"
        onCloseAutoFocus={returnFocusToOpener}
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        <RedeemStage
          prize={prize}
          ticketCount={ticketCount}
        />
        <div className="grid">
          <p
            aria-hidden="true"
            className="redeem-copy-lock flex flex-col items-center justify-center gap-2.5 [grid-area:1/1]"
          >
            <span className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
              {t("redeeming", { count: ticketCount })}
            </span>
            <span className="text-4xl font-extrabold tracking-[0.3em] text-muted-foreground">
              ???
            </span>
          </p>
          <DialogHeader className="redeem-copy-in items-center gap-2.5 text-center [grid-area:1/1] sm:text-center">
            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
              {t("eyebrow")}
            </p>
            <DialogTitle className="text-4xl leading-tight font-extrabold tracking-tight">
              {prizeNames(prize)}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t("description", { count: ticketCount, module: moduleTitle })}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="redeem-copy-in flex-col gap-2 sm:flex-none">
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("close")}
          </button>
          {/* Settled before the navigation starts, so no promise is left hanging. */}
          {continueHref ? (
            <Link
              href={continueHref as never}
              onClick={close}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t("continue")}
              <ArrowRight
                aria-hidden="true"
                className="size-4"
              />
            </Link>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

/** The prize on its rays, with the silhouette giving way and the tickets flying in. */
function RedeemStage({ prize, ticketCount }: { prize: PrizeId; ticketCount: number }) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex size-56 items-center justify-center"
    >
      <span className="redeem-rays absolute -inset-10 rounded-full bg-[repeating-conic-gradient(from_0deg,color-mix(in_oklab,var(--glow)_24%,transparent)_0deg_8deg,transparent_8deg_22deg)] [mask-image:radial-gradient(closest-side,#000_30%,transparent)]" />
      <span className="redeem-flash absolute size-48 rounded-full bg-[radial-gradient(closest-side,rgb(255_240_200/0.95),transparent_70%)]" />
      <span className="redeem-shake relative size-44">
        <span className="redeem-silhouette absolute inset-0">
          <PrizeIcon
            prize={prize}
            locked
            size={176}
          />
        </span>
        <span className="redeem-reveal prize-glow absolute inset-0">
          <PrizeIcon
            prize={prize}
            size={176}
          />
        </span>
      </span>
      {Array.from({ length: ticketCount }, (_, index) => (
        <span
          key={index}
          className="redeem-feed lesson-ticket absolute h-[18px] w-[30px] bg-ticket"
          style={feedStyle(index, ticketCount)}
        />
      ))}
    </div>
  );
}

/** Fans the tickets out below the prize and staggers their take-off, within fixed bounds. */
function feedStyle(index: number, ticketCount: number): CSSProperties {
  const gap = Math.min(22, FEED_SPREAD_PX / ticketCount);
  const stagger = Math.min(30, FEED_STAGGER_MS / ticketCount);
  const direction = index % 2 === 0 ? 1 : -1;
  return {
    "--feed-from-x": `${Math.round((index - (ticketCount - 1) / 2) * gap)}px`,
    "--feed-spin": `${direction * (20 + (index % 10) * 4)}deg`,
    "--feed-delay": `${Math.round(index * stagger)}ms`,
  } as CSSProperties;
}
