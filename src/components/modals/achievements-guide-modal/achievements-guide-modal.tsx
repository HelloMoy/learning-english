"use client";

import { LessonTicket } from "@/components/lesson-ticket/lesson-ticket";
import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties, type ReactNode } from "react";

/**
 * Explains how achievements are earned: tickets, prizes and the card's
 * distinction.
 *
 * @remarks
 * Shown imperatively with `NiceModal.show(AchievementsGuideModal)`. It asks
 * nothing, so its promise settles with `undefined` on every way out — **Got
 * it**, the close control, Escape, the overlay — and the caller does not wait
 * on it.
 *
 * Each level sits beside a small example drawn with the real pieces the
 * learner will see on the page. The examples are decoration: the sentence
 * beside each one says everything it shows.
 *
 * @example
 * ```tsx
 * <button onClick={() => void NiceModal.show(AchievementsGuideModal)}>How do they work?</button>
 * ```
 *
 * @category Components
 */
export const AchievementsGuideModal = NiceModal.create(function AchievementsGuideModal() {
  const modal = useModal();
  const t = useTranslations("Components.AchievementsGuideModal");
  // Read on the first render, before the dialog takes focus, so this is the
  // control that opened it. Radix only refocuses a DialogTrigger, and
  // NiceModal.show opens the dialog without one.
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
        className="max-w-lg"
        onCloseAutoFocus={returnFocusToOpener}
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-4">
          <GuideLevel
            order={0}
            example={<TicketExample />}
            title={t("ticketTitle")}
            body={t("ticketBody")}
          />
          <GuideLevel
            order={1}
            example={<PrizeExample />}
            title={t("prizeTitle")}
            body={t("prizeBody")}
          />
          <GuideLevel
            order={2}
            example={<DistinctionExample />}
            title={t("distinctionTitle")}
            body={t("distinctionBody")}
          />
        </ol>
        <DialogFooter>
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("close")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

const motionOrder = (order: number) => ({ "--motion-order": order }) as CSSProperties;

/** One level of the explanation, rising in its place of the sequence. */
function GuideLevel({
  order,
  example,
  title,
  body,
}: {
  order: number;
  example: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li
      style={motionOrder(order)}
      className="achievement-rise flex items-center gap-4 rounded-xl border border-border bg-background/40 p-3.5"
    >
      <span
        aria-hidden="true"
        className="flex w-20 shrink-0 items-center justify-center"
      >
        {example}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-bold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{body}</span>
      </span>
    </li>
  );
}

function TicketExample() {
  return <LessonTicket symbol="ɪ" />;
}

function PrizeExample() {
  return (
    <PrizeIcon
      prize="whistle"
      size={44}
    />
  );
}

function DistinctionExample() {
  return (
    <span className="flex gap-1.5">
      <span className="h-12 w-8 rounded-md border-2 border-bronze bg-[radial-gradient(90%_120%_at_0%_0%,color-mix(in_oklab,var(--bronze)_45%,var(--card)),var(--card)_70%)]" />
      <span className="h-12 w-8 rounded-md border-2 border-gold bg-[radial-gradient(90%_120%_at_0%_0%,color-mix(in_oklab,var(--glow)_50%,var(--card)),var(--card)_70%)]" />
    </span>
  );
}
