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

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

/**
 * Asks the learner to confirm deleting their account.
 *
 * @remarks
 * Shown imperatively with `await NiceModal.show(DeleteAccountModal)`, which
 * resolves `true` only when the learner confirms, and `false` on every other
 * way out: Cancel, the close control, Escape, the overlay.
 *
 * Cancel takes the initial focus, so a reflexive Enter backs out rather than
 * deleting. Confirming does not delete anything yet: the caller requests the
 * confirmation email, and the copy says so.
 *
 * @example
 * ```tsx
 * const confirmed = await NiceModal.show(DeleteAccountModal);
 * if (confirmed) await authClient.deleteUser({ callbackURL });
 * ```
 *
 * @category Components
 */
export const DeleteAccountModal = NiceModal.create(function DeleteAccountModal() {
  const modal = useModal();
  const t = useTranslations("Profile.deleteAccount");
  const cancelRef = useRef<HTMLButtonElement>(null);

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
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogConsequence")}</DialogDescription>
        </DialogHeader>
        <p className="text-sm font-semibold text-foreground">{t("dialogIrreversible")}</p>
        <p className="text-sm text-muted-foreground">{t("dialogEmail")}</p>
        <DialogFooter>
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={() => close(false)}
            className="min-h-11 px-5 font-semibold"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => close(true)}
            className="min-h-11 px-5 font-bold"
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
