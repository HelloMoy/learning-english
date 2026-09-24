"use client";

import { SafariGuideAutoplay } from "@/components/safari-install-guide/safari-guide-autoplay/safari-guide-autoplay";
import type { SafariPlatform } from "@/components/safari-install-guide/safari-install-steps/safari-install-steps";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog/dialog";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslations } from "next-intl";

type SafariInstallGuideModalProps = {
  /** Which Safari the learner is on; decides the guide and the dialog's name. */
  platform: SafariPlatform;
};

/**
 * The iPad and macOS install guides, in a modal.
 *
 * @remarks
 * Shown imperatively with `NiceModal.show(SafariInstallGuideModal, { platform })`,
 * so the header chip can open it without the guide being prop-drilled down to
 * it. The provider is already mounted in `global-providers`.
 *
 * `showCloseButton` is off because {@link SafariGuideAutoplay} draws its own
 * dismiss control; leaving the primitive's on would put two X's in the same
 * corner. That control calls `hide`, and `remove` runs once the close animation
 * has finished, which is what stops the guide's timer and unmounts it.
 *
 * The dialog is named by its own title rather than by the guide's heading: the
 * heading sells the idea while a dialog's accessible name should say what the
 * dialog is. The two platforms are named differently because they end in
 * different places — a home screen and a Dock — and a Mac has no home screen to
 * promise.
 *
 * @example
 * ```tsx
 * await NiceModal.show(SafariInstallGuideModal, { platform: "mac" });
 * ```
 *
 * @param props - See {@link SafariInstallGuideModalProps}
 * @category Components
 */
export const SafariInstallGuideModal = NiceModal.create(function SafariInstallGuideModal({
  platform,
}: SafariInstallGuideModalProps) {
  const modal = useModal();
  const t = useTranslations("Components.SafariInstallGuide");

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
        className="flex max-h-[calc(100svh-2rem)] max-w-lg flex-col overflow-hidden border-none bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">{t(`${platform}DialogTitle`)}</DialogTitle>
        <SafariGuideAutoplay
          platform={platform}
          onDismiss={modal.hide}
        />
      </DialogContent>
    </Dialog>
  );
});
