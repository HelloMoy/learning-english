"use client";

import type { AvailableInstallPath } from "@/hooks/use-install-path/use-install-path";

import NiceModal from "@ebay/nice-modal-react";
import { SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { AddToHomeScreenModal } from "../modals/add-to-home-screen-modal/add-to-home-screen-modal";
import { InstallPromptModal } from "../modals/install-prompt-modal/install-prompt-modal";
import { SafariInstallGuideModal } from "../modals/safari-install-guide-modal/safari-install-guide-modal";

type InstallAppButtonProps = {
  /** The route this browser offers. `SiteHeader` decides whether there is one. */
  path: AvailableInstallPath;
};

/** What activating the chip says it will do, and what it then does. */
type Destination = {
  readonly label: string;
  readonly open: () => void;
};

/**
 * The header chip that gets the course onto the learner's home screen or Dock.
 *
 * @remarks
 * Purely presentational, like the theme and locale chips beside it. Whether it
 * should exist at all is `SiteHeader`'s call, because that decision can only be
 * made after hydration and belongs with the thing that owns the header's
 * layout. What it opens is this component's call, and it is decided by the path
 * the header hands it — see {@link useInstallPath}.
 *
 * Four destinations, and the difference matters to the learner before they
 * press it. A browser that offered an install can perform it in a tap. The three
 * that cannot each need a different set of instructions, because an iPhone, an
 * iPad and a Mac put these controls in different places and call the last step
 * by different names — one ends on a home screen, the other in a Dock. The
 * accessible name says which of those is about to happen, because being told
 * "here is how to do it" and then handed a one-tap dialog is a promise the
 * control did not keep.
 *
 * The glyph is the same for all four. The control means one thing on every
 * platform; only what it opens differs. It is `SquarePlus`, the one iOS draws
 * beside "Add to Home Screen" — a download glyph would be wrong twice over:
 * nothing is downloaded, and it would teach the learner to look for the wrong
 * icon. It is decorative; the name carries the meaning.
 *
 * No destination is a one-shot prompt. A learner who dismisses any of them can
 * press the chip again and get it back.
 *
 * @example
 * ```tsx
 * const path = useInstallPath();
 *
 * if (path.kind === "none") return null;
 * return <InstallAppButton path={path} />;
 * ```
 *
 * @param props - See {@link InstallAppButtonProps}
 * @returns The header control
 * @see SafariInstallGuideModal
 * @see InstallPromptModal
 * @see AddToHomeScreenModal
 * @category Components
 */
export function InstallAppButton({ path }: InstallAppButtonProps) {
  const guide = useTranslations("Components.AddToHomeScreenGuide");
  const safari = useTranslations("Components.SafariInstallGuide");
  const prompt = useTranslations("Components.InstallPrompt");

  const destinationFor = (route: AvailableInstallPath): Destination => {
    switch (route.kind) {
      case "guide":
        return {
          label: guide("openGuide"),
          open: () => void NiceModal.show(AddToHomeScreenModal),
        };
      case "ipad-guide":
        return {
          label: safari("openGuideIpad"),
          open: () => void NiceModal.show(SafariInstallGuideModal, { platform: "ipad" }),
        };
      case "mac-guide":
        return {
          label: safari("openGuideMac"),
          open: () => void NiceModal.show(SafariInstallGuideModal, { platform: "mac" }),
        };
      case "prompt":
        return {
          label: prompt("openPrompt"),
          open: () => void NiceModal.show(InstallPromptModal, { onAccept: route.accept }),
        };
    }
  };

  const { label, open } = destinationFor(path);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={open}
      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-foreground/5 px-3 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <SquarePlus
        aria-hidden="true"
        className="size-4"
      />
    </button>
  );
}
