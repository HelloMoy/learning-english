"use client";

import { PrizeReadyModal } from "@/components/modals/prize-ready-modal/prize-ready-modal";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { earnTickets, useEarnedTickets } from "@/hooks/use-earned-tickets/use-earned-tickets";
import { useFullscreenElement } from "@/hooks/use-fullscreen-element/use-fullscreen-element";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import {
  announcePrize,
  clearPendingPrize,
  holdPrizeAnnouncement,
} from "@/hooks/use-pending-prize-announcement/use-pending-prize-announcement";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { ticketSymbol } from "@/lib/learner-achievements/learner-achievements";
import { prizeForModule, type PrizeId } from "@/lib/module-prizes/module-prizes";
import { countsAsComplete } from "@/lib/watch-progress/watch-progress";

import NiceModal from "@ebay/nice-modal-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A ticket just earned on the lesson page, as the ticket notification shows it.
 *
 * @remarks
 * `id` grows with every ticket observed while the page is open, so a new ticket
 * replaces the one on screen and restarts its lifetime. `readiesPrize` says this
 * ticket was the module's last, which is what the page acts on once the
 * notification has left.
 */
export type TicketMoment = {
  id: number;
  lessonTitle: string;
  symbol: string;
  ticketsEarned: number;
  ticketCount: number;
  prize: PrizeId;
  moduleTitle: string;
  moduleSlug: string;
  readiesPrize: boolean;
};

/**
 * How long the browser is given to restore the page after the learner leaves
 * fullscreen, before the waiting dialog opens.
 *
 * @remarks
 * `fullscreenchange` fires when the exit *begins*, so a dialog opened on it
 * spends its entrance behind the browser's own transition and looks like it had
 * been there all along. There is no event for "the exit finished", which is why
 * this is a constant.
 */
export const PRIZE_READY_DELAY_AFTER_FULLSCREEN_MS = 500;

/** The ticket to show, if any, and the way to put it away. */
export type LessonRewardMoment = {
  ticket: TicketMoment | null;
  dismissTicket: () => void;
};

type HasTicket = (lesson: Lesson) => boolean;

/**
 * Celebrates the lesson on screen earning its ticket, and hands the learner on
 * to the counter when that ticket was the module's last.
 *
 * @remarks
 * It observes the tickets instead of being told by whoever completed the lesson,
 * so marking it and watching it to the end both celebrate, exactly once, with
 * the same rule every progress surface counts with.
 *
 * Only earning a ticket counts — not completion itself. The first value is taken
 * once the mount-time storage read has settled, so opening a lesson completed on
 * an earlier visit stays quiet; and because a ticket is kept once earned,
 * un-marking and completing again announces nothing a second time.
 *
 * A learner watching fullscreen still sees the ticket — `TicketToast` renders
 * into the presented element — but the prize dialog waits until they leave
 * fullscreen rather than covering the lesson they are watching, and then waits
 * a moment more so its entrance is seen and not spent behind the restore.
 *
 * A waiting prize is recorded the instant its last ticket is earned, so a
 * learner who moves on before the dialog is due is still told about it on the
 * next page they open. While this page is on screen it holds that announcement,
 * so the news can never arrive over the ticket it belongs to; the hold leaves
 * with the page.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @example
 * ```tsx
 * const { ticket, dismissTicket } = useLessonRewardMoment({ lesson, module, moduleLessons });
 * return <TicketToast moment={ticket} onDone={dismissTicket} />;
 * ```
 *
 * @param input - The lesson on screen, its module, and every lesson of that module
 * @returns The current ticket moment and a way to dismiss it
 */
export function useLessonRewardMoment({
  lesson,
  module,
  moduleLessons,
}: {
  lesson: Lesson;
  module: Module;
  moduleLessons: ReadonlyArray<Lesson>;
}): LessonRewardMoment {
  const hasTicket = useHasTicket();
  const lessonHasTicket = hasTicket(lesson);
  const hasSettled = useHasSettled();
  const fullscreenElement = useFullscreenElement();
  const lastSeenTicket = useRef<boolean | null>(null);
  const ticketsShown = useRef(0);
  const waitingPrize = useRef<TicketMoment | null>(null);
  const releaseAnnouncement = useRef<(() => void) | null>(null);
  const [ticket, setTicket] = useState<TicketMoment | null>(null);

  useEffect(() => {
    if (!hasSettled) return;
    const hadTicket = lastSeenTicket.current;
    lastSeenTicket.current = lessonHasTicket;
    if (hadTicket !== false || !lessonHasTicket) return;

    // Store it before anything else: from here on the ticket is the learner's,
    // whatever they do with the lesson afterwards.
    earnTickets([lesson.id]);
    const ticketsEarned = moduleLessons.filter(hasTicket).length;
    // Record the waiting prize now, not when the dialog is due: the learner can
    // be on another page by then, and this page's timer dies with it.
    if (ticketsEarned === moduleLessons.length) {
      announcePrize(module.slug);
      // This page owes the learner that dialog, so it keeps the announcement to
      // itself until it has made it — or until the learner takes it elsewhere.
      releaseAnnouncement.current?.();
      releaseAnnouncement.current = holdPrizeAnnouncement();
    }
    ticketsShown.current += 1;
    setTicket({
      id: ticketsShown.current,
      lessonTitle: lesson.title,
      symbol: ticketSymbol(lesson.title, positionInModule(lesson, moduleLessons)),
      ticketsEarned,
      ticketCount: moduleLessons.length,
      prize: prizeForModule(module.slug),
      moduleTitle: module.title,
      moduleSlug: module.slug,
      readiesPrize: ticketsEarned === moduleLessons.length,
    });
  }, [hasSettled, lessonHasTicket, hasTicket, lesson, module, moduleLessons]);

  /** Makes the announcement this page has been holding, and lets it go. */
  const announcePrizeReady = useCallback((moment: TicketMoment) => {
    releaseAnnouncement.current?.();
    releaseAnnouncement.current = null;
    showPrizeReady(moment);
  }, []);

  const dismissTicket = useCallback(() => {
    setTicket(null);
    if (!ticket?.readiesPrize) return;
    // A dialog the learner cannot see must not be listening for the Escape they
    // meant for the video, so it waits for them to come back out.
    if (fullscreenElement !== null) {
      waitingPrize.current = ticket;
      return;
    }
    announcePrizeReady(ticket);
  }, [ticket, fullscreenElement, announcePrizeReady]);

  useEffect(() => {
    if (fullscreenElement !== null || waitingPrize.current === null) return;
    // Let the page finish coming back, so the learner sees the dialog arrive.
    const timer = window.setTimeout(() => {
      const waiting = waitingPrize.current;
      if (waiting === null) return;
      waitingPrize.current = null;
      announcePrizeReady(waiting);
    }, PRIZE_READY_DELAY_AFTER_FULLSCREEN_MS);
    // Going back into fullscreen before it opens keeps the prize waiting.
    return () => window.clearTimeout(timer);
  }, [fullscreenElement, announcePrizeReady]);

  // Leaving with the dialog still owed hands the announcement to whatever page
  // the learner opens next.
  useEffect(
    () => () => {
      releaseAnnouncement.current?.();
      releaseAnnouncement.current = null;
    },
    [],
  );

  return { ticket, dismissTicket };
}

/**
 * Opens the dialog that sends the learner to the counter to claim their prize,
 * and spends the record that would have opened it on the next page.
 */
function showPrizeReady({ prize, moduleTitle, moduleSlug, ticketCount }: TicketMoment): void {
  clearPendingPrize();
  void NiceModal.show(PrizeReadyModal, { prize, moduleTitle, moduleSlug, ticketCount });
}

/** A ticket is earned once stored, or the first moment its lesson counts as complete. */
function useHasTicket(): HasTicket {
  const earnedTickets = useEarnedTickets();
  const completedLessons = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  return useCallback(
    (lesson: Lesson) =>
      earnedTickets.has(lesson.id) ||
      countsAsComplete({
        isMarkedComplete: completedLessons.has(lesson.id),
        positionSeconds: positions.get(lesson.id) ?? null,
        durationSeconds: lesson.kind === "video" ? lesson.durationSeconds : 0,
      }),
    [earnedTickets, completedLessons, positions],
  );
}

/**
 * `false` until a task after mount.
 *
 * @remarks
 * The stores subscribe after the first render and re-render at once if storage
 * differs from the snapshot they rendered with. That re-render is a correction,
 * not a completion, so the baseline waits until it has happened.
 */
function useHasSettled(): boolean {
  const [hasSettled, setHasSettled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setHasSettled(true), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return hasSettled;
}

function positionInModule(lesson: Lesson, moduleLessons: ReadonlyArray<Lesson>): number {
  const earlierLessons = moduleLessons.filter((candidate) => candidate.sequence < lesson.sequence);
  return earlierLessons.length + 1;
}
