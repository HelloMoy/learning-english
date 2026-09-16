"use client";

import { LessonTicket } from "@/components/lesson-ticket/lesson-ticket";
import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import { useFullscreenElement } from "@/hooks/use-fullscreen-element/use-fullscreen-element";
import type { TicketMoment } from "@/hooks/use-lesson-reward-moment/use-lesson-reward-moment";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** How long a ticket notification stays before it asks to leave. */
export const TICKET_TOAST_LIFETIME_MS = 5000;

/**
 * The notification a lesson page shows when the learner earns a ticket: the
 * ticket dropping out of its slot, the tickets collected towards the module's
 * prize, and that prize's silhouette.
 *
 * @remarks
 * The status region is always mounted, so screen readers are listening before a
 * ticket arrives; the pill inside it appears with the moment. It sits at the top
 * at every width — where the learner is looking after pressing a control, and
 * clear of the player's own chrome. It never takes focus and only the pill
 * itself catches the pointer.
 *
 * While the browser is presenting an element fullscreen, the region is rendered
 * into that element: nothing outside it is painted, so a learner watching
 * fullscreen would otherwise never see the ticket they just earned. After
 * {@link TICKET_TOAST_LIFETIME_MS} it calls `onDone` — a timer, not the
 * animation, so it leaves under reduced motion too. A moment with a new `id`
 * restarts that lifetime.
 *
 * @example
 * ```tsx
 * <TicketToast moment={ticket} onDone={dismissTicket} />
 * ```
 *
 * @param moment - The ticket to show, or `null` for none
 * @param onDone - Called once the notification has been up for its lifetime
 */
export function TicketToast({
  moment,
  onDone,
}: {
  moment: TicketMoment | null;
  onDone: () => void;
}) {
  const fullscreenElement = useFullscreenElement();

  const region = (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-50 flex justify-center px-4"
    >
      {moment ? (
        <TicketPill
          key={moment.id}
          moment={moment}
          onDone={onDone}
        />
      ) : null}
    </div>
  );

  // The browser paints only what it is presenting, so while a lesson is watched
  // fullscreen the notification has to live inside that element to be seen.
  return fullscreenElement ? createPortal(region, fullscreenElement) : region;
}

function TicketPill({ moment, onDone }: { moment: TicketMoment; onDone: () => void }) {
  const t = useTranslations("Components.TicketToast");
  useLifetime(onDone);

  return (
    <div className="ticket-toast pointer-events-auto flex w-full max-w-[40rem] items-center gap-3 rounded-full border border-primary/45 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--ticket)_14%,var(--card)),var(--card)_55%)] p-2 pr-5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] [--toast-knob:4.25rem] sm:p-2.5 sm:pr-6 sm:[--toast-knob:5.25rem]">
      <TicketSlot symbol={moment.symbol} />
      <span className="ticket-toast-copy flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[11px] font-bold tracking-[0.2em] text-primary">
          {t("earned", { lesson: moment.lessonTitle })}
        </span>
        <span className="line-clamp-2 text-sm leading-snug font-bold text-foreground sm:truncate sm:text-base">
          {t("progress", {
            earned: moment.ticketsEarned,
            count: moment.ticketCount,
            module: moment.moduleTitle,
          })}
        </span>
        <span
          aria-hidden="true"
          className="h-1 overflow-hidden rounded-full bg-secondary"
        >
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${(moment.ticketsEarned / moment.ticketCount) * 100}%` }}
          />
        </span>
      </span>
      <span
        aria-hidden="true"
        className="shrink-0"
      >
        <PrizeIcon
          prize={moment.prize}
          locked
          size={44}
        />
      </span>
    </div>
  );
}

/** The dispenser's round window, with the ticket rising out of its slot. */
function TicketSlot({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative size-[3.25rem] shrink-0 overflow-hidden rounded-full bg-background sm:size-16"
    >
      <span className="absolute inset-x-0 top-1 flex h-[58%] items-end justify-center overflow-hidden">
        <LessonTicket
          symbol={symbol}
          className="ticket-dispense"
        />
      </span>
      <span className="absolute inset-x-2 top-[64%] h-1 rounded-sm bg-foreground/80" />
    </span>
  );
}

/** Calls `onDone` once, a lifetime after mount, with whichever callback is current by then. */
function useLifetime(onDone: () => void) {
  const latestOnDone = useRef(onDone);
  useEffect(() => {
    latestOnDone.current = onDone;
  });
  useEffect(() => {
    const timer = window.setTimeout(() => latestOnDone.current(), TICKET_TOAST_LIFETIME_MS);
    return () => window.clearTimeout(timer);
  }, []);
}
