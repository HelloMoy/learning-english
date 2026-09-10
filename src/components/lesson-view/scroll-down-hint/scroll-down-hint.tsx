"use client";

import { Button } from "@/components/ui/button/button";

import { ArrowDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * The scroll hint drawn over the enlarged video while the browser's own chrome
 * still takes part of the screen.
 *
 * @remarks
 * On an iPhone the enlarged video reaches the whole screen only after a real
 * scroll hides Safari's toolbar, and a rotation brings that toolbar back. There
 * is nothing the page can do about it programmatically, so this tells the
 * learner the one thing that works. Whether it should be on screen is not
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
 * **The direction lives in the arrow, not in the words, and the arrow means the
 * page, not the finger.** Those are opposite here: the page scrolls *down*
 * because the finger travels *up*. The copy used to name the finger's
 * direction — "desliza hacia arriba" — and learners holding a phone in
 * landscape read it against the wrong axis and swiped the other way. So the
 * visible line names only the outcome, and the downward arrow is left as the
 * single channel for direction.
 *
 * That choice binds the copy: the verb has to be one of **scrolling**, never of
 * swiping. "Desliza" beside a downward arrow instructs the finger downward,
 * which reclaims nothing — two cues disagreeing, which is the whole defect this
 * component was rewritten to remove. Whoever edits `message` next inherits that
 * constraint: keep the verb about the page, and keep every direction word out.
 *
 * **The direction lives in the glyph, not in a class.** An earlier version drew
 * `ArrowUp` and flipped it with `rotate-180`, which renders correctly in every
 * engine — and still shipped the bug once, on a phone that picked up the new JS
 * while holding a cached stylesheet. It drew the new copy beside an upward
 * arrow, because the rule that flipped it was new to the stylesheet and that
 * device did not have it yet. `ArrowDown` cannot fail that way. Keep it: what
 * CSS carries here is the motion, and a stylesheet that never arrives should
 * cost a still arrow, never a wrong one.
 *
 * The travel is bounded rather than endless. The learner enlarged the video to
 * watch it, and a cue that never stops moving over it works against the thing
 * they asked for, so the arrow demonstrates the direction and then holds still,
 * still pointing. `arrow-drop` in `globals.css` is Tailwind's `bounce`
 * mirrored, since that one travels up; see the comment at its use site for why
 * the bound is a half iteration and not a whole one. All of the motion is
 * dropped under `prefers-reduced-motion`, which leaves exactly the still
 * pointing arrow.
 *
 * `role="status"` lets assistive technology hear the hint without focus
 * leaving the player. An arrow states nothing there, so `screenReaderMessage`
 * carries the direction in words and the visible line is `aria-hidden` — both
 * sit in the same region, and without that the promise is read twice, once
 * stripped of its direction and once with it. The glyphs are `lucide-react`'s,
 * like the resume overlay's: this is app chrome drawn over the video, not a
 * player control.
 *
 * @category Components
 */
export function ScrollDownHint() {
  const t = useTranslations("Components.ScrollDownHint");
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-3 z-20 flex animate-in justify-center px-3 duration-300 fade-in slide-in-from-top-2 motion-reduce:animate-none"
    >
      <div className="flex max-w-full min-w-0 items-center gap-2 rounded-full border border-border bg-card/90 py-1 pr-1 pl-3 text-sm text-foreground shadow-lg backdrop-blur">
        {/*
          The glyph points down on its own — no rotation. Direction is not a
          styling concern here: a device that picks up new JS while holding a
          cached stylesheet must still get a downward arrow, and a CSS flip
          lets that device draw this copy beside an upward one. Missing CSS may
          cost the motion, never the direction.

          6.5 iterations, not 7: `arrow-drop` holds the displaced position at
          both 0% and 100%, so a whole number ends the animation held out and
          the arrow snaps back into place in a single frame. The half iteration
          lands on the resting keyframe, where the base style already is. The
          count is generous because a learner spends the first seconds of an
          enlarged video looking at the video, not at this corner.
        */}
        <ArrowDown
          data-slot="scroll-direction-arrow"
          aria-hidden="true"
          className="size-4 shrink-0 animate-arrow-drop repeat-[6.5] motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="whitespace-nowrap"
        >
          {t("message")}
        </span>
        <span className="sr-only">{t("screenReaderMessage")}</span>
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
