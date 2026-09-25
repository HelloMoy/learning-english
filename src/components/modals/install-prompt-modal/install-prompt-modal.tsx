"use client";

import { InstallPromptArt } from "@/components/install-prompt-art/install-prompt-art";
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

/**
 * Which wording the prompt is speaking in.
 *
 * @remarks
 * A desktop has a dock or a taskbar, never a home screen, so the two platforms
 * need different sentences rather than one sentence that is wrong on one of
 * them.
 *
 * @category Components
 */
export type InstallPromptSurface = "handheld" | "desktop";

/**
 * Whether the device the learner is holding has a home screen to add to.
 *
 * @remarks
 * A coarse pointer rather than another user-agent regex: the real question is
 * whether this is a touch device, and the pointer media query answers it
 * directly instead of inferring it from a string vendors have spent two decades
 * lying in.
 */
const surfaceInUse = (): InstallPromptSurface =>
  window.matchMedia?.("(pointer: coarse)").matches === true ? "handheld" : "desktop";

type InstallPromptModalProps = {
  /**
   * Opens the browser's own install dialog. Called from the learner's click, so
   * it must not be wrapped in anything asynchronous — see
   * {@link InstallPromptModal}.
   */
  onAccept: () => void;
};

/**
 * The install prompt: one question, two answers, then the browser takes over.
 *
 * @remarks
 * Shown imperatively with `NiceModal.show(InstallPromptModal, { onAccept })`,
 * so the header chip can open it without the modal being prop-drilled down to
 * it. The provider is already mounted in `global-providers`.
 *
 * It shows where the app will come to rest before it asks — the home screen on
 * a handheld, the application switcher on a desktop. The Safari guides all end
 * on that frame, because a guide that stops at the confirmation asks for effort
 * and never shows the payoff; this prompt used to make the same omission in one
 * screen. The picture carries the icon, which is why no identity row sits
 * beside it.
 *
 * It installs nothing itself. Accepting calls `onAccept`, which opens the
 * browser's own install dialog, and the modal closes out of its way — two
 * stacked dialogs would leave the learner confirming into this one while the
 * real question waited behind it. Nothing here reports success either: the
 * outcome belongs to a dialog this application does not draw, so claiming it
 * would be claiming to know something it cannot see.
 *
 * `onAccept` is called before the modal is hidden and with nothing awaited in
 * between. A browser only honours an install request made from inside a real
 * gesture, and anything asynchronous ahead of it spends that gesture.
 *
 * Declining closes the modal and records nothing. The prompt is reached from a
 * header control the learner chose to press, so it is a reference they can come
 * back to rather than a one-shot offer; remembering a refusal would take the
 * control away from someone who pressed it again on purpose.
 *
 * The dialog is named by its own title rather than by the visible heading: the
 * heading sells the idea while a dialog's accessible name should say what the
 * dialog is — the same split {@link AddToHomeScreenModal} makes.
 *
 * @example
 * ```tsx
 * const path = useInstallPath();
 *
 * if (path.kind === "prompt") {
 *   void NiceModal.show(InstallPromptModal, { onAccept: path.accept });
 * }
 * ```
 *
 * @param props - See {@link InstallPromptModalProps}
 * @returns The prompt, in a modal dialog
 * @see useInstallPrompt
 * @category Components
 */
export const InstallPromptModal = NiceModal.create(function InstallPromptModal({
  onAccept,
}: InstallPromptModalProps) {
  const modal = useModal();
  const t = useTranslations("Components.InstallPrompt");
  const surface = surfaceInUse();

  const acceptAndStandAside = () => {
    onAccept();
    modal.hide();
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) modal.hide();
      }}
    >
      <DialogContent
        className="max-w-sm"
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
        <InstallPromptArt surface={surface} />
        <DialogHeader>
          <p className="text-base font-semibold text-balance">{t(`${surface}.title`)}</p>
          <DialogDescription className="text-pretty">{t(`${surface}.body`)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => modal.hide()}
            className="min-h-11 px-5 font-semibold"
          >
            {t("dismiss")}
          </Button>
          <Button
            size="lg"
            onClick={acceptAndStandAside}
            className="min-h-11 px-5 font-semibold"
          >
            {t(`${surface}.confirm`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
