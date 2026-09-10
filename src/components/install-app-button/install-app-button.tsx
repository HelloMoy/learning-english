"use client";

import NiceModal from "@ebay/nice-modal-react";
import { SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { AddToHomeScreenModal } from "../modals/add-to-home-screen-modal/add-to-home-screen-modal";

/**
 * The header chip that opens the add-to-home-screen guide.
 *
 * @remarks
 * Purely presentational, like the theme and locale chips beside it. Whether it
 * should exist at all — Safari, on an iPhone, not already launched from the
 * home screen — is `SiteHeader`'s call, because that decision can only be made
 * after hydration and belongs with the thing that owns the header's layout.
 *
 * The glyph is `SquarePlus`, which is the one iOS draws beside "Add to Home
 * Screen". A download glyph would be wrong twice over: nothing is downloaded,
 * and it would teach the learner to look for the wrong icon. It is decorative;
 * the button's accessible name carries the meaning.
 *
 * The guide is a reference rather than a prompt, so this stays in the header
 * instead of appearing once and being gone — a learner who dismisses it can
 * come back.
 *
 * @returns The header control
 * @see AddToHomeScreenModal
 * @category Components
 */
export function InstallAppButton() {
  const t = useTranslations("Components.AddToHomeScreenGuide");

  return (
    <button
      type="button"
      aria-label={t("openGuide")}
      onClick={() => void NiceModal.show(AddToHomeScreenModal)}
      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-foreground/5 px-3 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <SquarePlus
        aria-hidden="true"
        className="size-4"
      />
    </button>
  );
}
