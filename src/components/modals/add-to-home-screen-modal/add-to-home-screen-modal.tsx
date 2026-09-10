"use client";

import { GuideAutoplay } from "@/components/add-to-home-screen-guide/guide-autoplay/guide-autoplay";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog/dialog";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslations } from "next-intl";

/**
 * The add-to-home-screen guide, in a modal.
 *
 * @remarks
 * Shown imperatively with `NiceModal.show(AddToHomeScreenModal)`, so anything
 * can open it without the guide being prop-drilled down to it. The provider is
 * already mounted in `global-providers`.
 *
 * `showCloseButton` is off because {@link GuideAutoplay} draws its own dismiss
 * control; leaving the primitive's on would put two X's in the same corner.
 * That control calls `hide`, and `remove` runs once the close animation has
 * finished, which is what stops the guide's timer and unmounts it.
 *
 * The dialog is named by its own title rather than by the guide's heading: the
 * heading sells the idea ("keep the course one tap away") while a dialog's
 * accessible name should say what the dialog is.
 *
 * @example
 * ```tsx
 * await NiceModal.show(AddToHomeScreenModal);
 * ```
 *
 * @category Components
 */
export const AddToHomeScreenModal = NiceModal.create(function AddToHomeScreenModal() {
  const modal = useModal();
  const t = useTranslations("Components.AddToHomeScreenGuide");

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) modal.hide();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
        className="flex max-h-[calc(100svh-2rem)] max-w-md flex-col overflow-hidden border-none bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
        <GuideAutoplay onDismiss={modal.hide} />
      </DialogContent>
    </Dialog>
  );
});
