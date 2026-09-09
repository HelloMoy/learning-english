"use client";

import { Button } from "@/components/ui/button/button";

import { ArrowUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * The "swipe up" hint drawn over the enlarged video while the browser's own
 * chrome still takes part of the screen.
 *
 * @remarks
 * On an iPhone the enlarged video reaches the whole screen only after a real
 * swipe hides Safari's toolbar, and a rotation brings that toolbar back. There
 * is nothing the page can do about it programmatically, so this tells the
 * learner the one gesture that works. Whether it should be on screen is not
 * its decision: `LessonVideoPlayer` renders it while the mode is active and
 * `useBrowserChromeVisible` says the chrome is there, and unmounts it the
 * moment either stops being true.
 *
 * It is an ordinary child of the player box, absolutely positioned along its
 * top edge, so it moves with the pinned player and needs no portal. The
 * wrapper is `pointer-events-none`: the gesture it asks for has to land on the
 * player and travel through it to the document, and a hint that swallowed it
 * would defeat itself. Only the dismiss control takes the pointer.
 *
 * Dismissal is local state, so it lasts exactly as long as this instance —
 * the rest of the enlarged session — and the next one starts fresh.
 *
 * `role="status"` lets assistive technology hear the hint without focus
 * leaving the player. The glyphs are `lucide-react`'s, like the resume
 * overlay's: this is app chrome drawn over the video, not a player control.
 *
 * @category Components
 */
export function SwipeUpHint() {
  const t = useTranslations("Components.SwipeUpHint");
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3"
    >
      <div className="flex max-w-full min-w-0 items-center gap-2 rounded-full border border-border bg-card/90 py-1 pr-1 pl-3 text-sm text-foreground shadow-lg backdrop-blur">
        <ArrowUp
          aria-hidden="true"
          className="size-4 shrink-0"
        />
        <span>{t("message")}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("dismiss")}
          onClick={() => setIsDismissed(true)}
          className="pointer-events-auto shrink-0 rounded-full"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
