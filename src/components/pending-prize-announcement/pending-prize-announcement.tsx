"use client";

import { PrizeReadyModal } from "@/components/modals/prize-ready-modal/prize-ready-modal";
import { useLearnerAchievements } from "@/hooks/use-learner-achievements/use-learner-achievements";
import {
  clearPendingPrize,
  useIsPrizeAnnouncementHeld,
  usePendingPrizeAnnouncement,
} from "@/hooks/use-pending-prize-announcement/use-pending-prize-announcement";
import { usePathname } from "@/i18n/navigation";
import type {
  AchievementLevel,
  ModuleAchievements,
} from "@/lib/learner-achievements/learner-achievements";

import NiceModal from "@ebay/nice-modal-react";
import { useEffect, useRef } from "react";

/** The counter itself already shows the prize and its Claim control. */
const COUNTER_PATH = "/achievements";

/**
 * Tells the learner about a prize whose announcement the lesson page never got
 * to make.
 *
 * @remarks
 * Collecting a module's last ticket opens the waiting-prize dialog a few seconds
 * later, once the ticket notification has left — and a learner who moves on to
 * the next lesson in those seconds takes the page that owed them the dialog with
 * them. The prize is recorded the instant it is won, so this makes the
 * announcement wherever they landed instead.
 *
 * It renders nothing. Mount it once, above the pages, so the announcement
 * survives navigation.
 *
 * The record is spent the moment it is acted on, so the dialog arrives exactly
 * once: at the counter it is spent in silence, and a prize already claimed is
 * dropped without a word. A prize that is neither ready nor claimed is left
 * waiting — on the first render the device's tickets have not been read yet, and
 * that is not the same as having none.
 *
 * It stays quiet while the page that won the prize is still on screen: that page
 * plays the ticket first and opens the dialog itself, and this would otherwise
 * talk over the moment it belongs to. The instant that page lets go — by making
 * the announcement, or by the learner leaving — this one takes over.
 *
 * Browser-side only — do NOT render from a Server Component.
 *
 * @example
 * ```tsx
 * <PendingPrizeAnnouncement levels={levels} />
 * ```
 *
 * @param levels - Every catalog course, for deciding where the prize stands
 */
export function PendingPrizeAnnouncement({
  levels,
}: {
  levels: ReadonlyArray<AchievementLevel>;
}): null {
  const pendingModuleSlug = usePendingPrizeAnnouncement();
  const achievements = useLearnerAchievements(levels);
  const isAtCounter = usePathname().startsWith(COUNTER_PATH);
  const isHeldElsewhere = useIsPrizeAnnouncementHeld();
  // By module, not a flag: this never unmounts, so having spoken once must not
  // leave it unable to speak for the next prize.
  const announcedFor = useRef<string | null>(null);
  const waiting = moduleOf(achievements.courses, pendingModuleSlug);

  useEffect(() => {
    if (pendingModuleSlug === null || announcedFor.current === pendingModuleSlug) return;
    if (isHeldElsewhere) return;
    if (isAtCounter) {
      announcedFor.current = pendingModuleSlug;
      clearPendingPrize();
      return;
    }
    // Tickets still unread, or the learner beat us to the counter.
    if (waiting === undefined) return;
    if (waiting.prizeState !== "ready" && waiting.prizeState !== "claimed") return;

    announcedFor.current = pendingModuleSlug;
    clearPendingPrize();
    if (waiting.prizeState === "claimed") return;
    void NiceModal.show(PrizeReadyModal, {
      prize: waiting.prize,
      moduleTitle: waiting.module.title,
      moduleSlug: waiting.module.slug,
      ticketCount: waiting.tickets.length,
    });
  }, [pendingModuleSlug, isAtCounter, isHeldElsewhere, waiting]);

  return null;
}

function moduleOf(
  courses: ReadonlyArray<{ modules: ModuleAchievements[] }>,
  moduleSlug: string | null,
): ModuleAchievements | undefined {
  if (moduleSlug === null) return undefined;
  return courses
    .flatMap((course) => course.modules)
    .find((achievements) => achievements.module.slug === moduleSlug);
}
