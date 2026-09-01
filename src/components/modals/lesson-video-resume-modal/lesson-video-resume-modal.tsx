"use client";

import { Button } from "@/components/ui/button/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslations } from "next-intl";

/**
 * What the learner decided when the resume modal closed.
 *
 * - `resume` — take me back to `seconds`
 * - `restart` — play from the top
 * - `dismissed` — closed without choosing (Escape, backdrop, or close button)
 *
 * `dismissed` exists so `await NiceModal.show(...)` always settles with a
 * meaningful value instead of an ambiguous `undefined`. Callers are expected to
 * treat it as `restart` — see
 * `openspec/changes/resume-dialog-shadcn-primitive/design.md` §D2.
 */
export type LessonVideoResumeChoice =
  { action: "resume"; seconds: number } | { action: "restart" } | { action: "dismissed" };

/**
 * The "Resume from MM:SS · Restart from beginning" modal, shown when a learner
 * returns to a video lesson they left partway through.
 *
 * @remarks
 * Opened imperatively — the caller does **not** render it:
 *
 * ```tsx
 * const choice = await NiceModal.show(LessonVideoResumeModal, { positionSeconds: 180 });
 * ```
 *
 * It is purely a decision surface. It does not read or write storage, and it
 * does not touch the `<video>` element; it reports the learner's choice and
 * `PlaybackPositionedVideoPlayer` acts on it. Whether a saved position is worth
 * offering at all is `isPositionResumable`'s call — this modal assumes the
 * caller already checked and renders whatever position it is handed.
 *
 * Every exit path resolves exactly once, so the awaiting caller can never hang.
 * Closing without choosing resolves `{ action: "dismissed" }`, which the player
 * treats as "restart": the learner is never trapped, and the stored position
 * survives for the next visit.
 *
 * The modal is torn down with `remove()` rather than `hide()` so the portal and
 * its NiceModal registry entry go with it; the trade-off is that the close
 * animation does not play, which is not worth leaking a resolved modal for.
 *
 * @param positionSeconds - The saved position to offer, in seconds
 */
export const LessonVideoResumeModal = NiceModal.create(
  ({ positionSeconds }: { positionSeconds: number }) => {
    const modal = useModal();
    const t = useTranslations("Components.LessonVideoResumeModal");

    const close = (choice: LessonVideoResumeChoice) => {
      modal.resolve(choice);
      modal.remove();
    };

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => {
          if (!open) close({ action: "dismissed" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogLabel")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <p className="text-lg font-semibold text-foreground">
            {t("resumeFrom", { seconds: formatMinutesSeconds(positionSeconds) })}
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              onClick={() => close({ action: "restart" })}
            >
              {t("restartCta")}
            </Button>
            <Button
              size="lg"
              onClick={() => close({ action: "resume", seconds: positionSeconds })}
            >
              {t("resumeCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
