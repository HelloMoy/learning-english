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
import { useTranslations } from "next-intl";
import { useState } from "react";

/** What the dialog announces: whose tickets are complete, and how many. */
export type PrizeReadyModalProps = {
  prize: PrizeId;
  moduleTitle: string;
  moduleSlug: string;
  ticketCount: number;
};

/**
 * Tells the learner a prize is waiting for them at the counter, without
 * showing which one.
 *
 * @remarks
 * Shown by the lesson page once the ticket notification has left, when that
 * completion collected the module's last ticket. The prize stays a silhouette
 * on purpose: the reveal belongs to the counter, where the learner claims it,
 * so the walk there is worth taking.
 *
 * Its promise settles with `undefined` on every way out — **Keep learning**, the
 * close control, Escape — and focus returns to the control that had it, since
 * there is no DialogTrigger for Radix to refocus.
 *
 * @example
 * The link carries the module along, so the counter can bring that prize into
 * view among the shelves instead of leaving the learner to find it.
 *
 * @example
 * ```ts
 * void NiceModal.show(PrizeReadyModal, { prize: "harmonica", moduleTitle: "Vowels", moduleSlug: "2-vowels", ticketCount: 17 });
 * ```
 *
 * @category Components
 */
export const PrizeReadyModal = NiceModal.create(function PrizeReadyModal({
  prize,
  moduleTitle,
  moduleSlug,
  ticketCount,
}: PrizeReadyModalProps) {
  const modal = useModal();
  const t = useTranslations("Components.PrizeReadyModal");
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
        className="max-w-md gap-5 border-primary/45 px-8 pt-9 pb-8 text-center"
        onCloseAutoFocus={returnFocusToOpener}
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        <div
          aria-hidden="true"
          className="prize-ready-pulse mx-auto flex size-40 items-center justify-center"
        >
          <PrizeIcon
            prize={prize}
            locked
            size={140}
          />
        </div>
        <DialogHeader className="items-center gap-2.5 text-center sm:text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
            {t("eyebrow")}
          </p>
          <DialogTitle className="text-3xl leading-tight font-extrabold tracking-tight">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("description", { count: ticketCount, module: moduleTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2.5 sm:flex-none">
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-foreground/5 px-4 text-sm font-bold text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("keepLearning")}
          </button>
          <Link
            href={`/achievements?claim=${moduleSlug}`}
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("goClaim")}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
