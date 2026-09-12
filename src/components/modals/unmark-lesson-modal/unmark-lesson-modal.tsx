"use client";

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

/**
 * Asks the learner to confirm un-marking a lesson they had completed.
 *
 * @remarks
 * Shown imperatively with `await NiceModal.show(UnmarkLessonModal)`, which
 * resolves `true` when the learner confirms and `false` on every other way
 * out — the cancel button, the close control, Escape, the overlay. The
 * caller therefore branches on one boolean and owns the write; this
 * component owns only the question.
 *
 * The copy names all four consequences rather than asking "are you sure?":
 * progress meters drop, the outline's mark disappears, watching the lesson
 * to the end again re-marks it (the finish threshold is a second producer of
 * completion), and the saved playback position survives. A learner cannot
 * weigh an undo whose effects are not spelled out.
 *
 * @example
 * ```tsx
 * const confirmed = await NiceModal.show(UnmarkLessonModal);
 * if (confirmed) await unmarkLessonComplete(lessonId);
 * ```
 *
 * @category Components
 */
export const UnmarkLessonModal = NiceModal.create(function UnmarkLessonModal() {
  const modal = useModal();
  const t = useTranslations("Components.UnmarkLessonModal");

  const close = (confirmed: boolean) => {
    modal.resolve(confirmed);
    modal.hide();
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) close(false);
      }}
    >
      <DialogContent
        className="max-w-md"
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("consequence")}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("rewatch")}</p>
        <p className="text-sm text-muted-foreground">{t("positionKept")}</p>
        <DialogFooter>
          <button
            type="button"
            onClick={() => close(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-destructive px-5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-destructive/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("confirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
