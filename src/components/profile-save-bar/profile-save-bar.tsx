"use client";

import { Button } from "@/components/ui/button/button";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Where the learner's card stands between the form and storage.
 *
 * @remarks
 * `clean` draws nothing at all: a card with nothing edited has nothing to save
 * and nothing to discard.
 */
export type ProfileSaveState = "clean" | "unsaved" | "saving" | "saved";

/**
 * Props for {@link ProfileSaveBar}.
 */
export type ProfileSaveBarProps = {
  /** Where the card stands: nothing edited, edited, saving, or just saved. */
  state: ProfileSaveState;
  /** Whether the edited card can be stored — a blank name cannot. */
  canSave: boolean;
  /** Stores the edited card. */
  onSave: () => void;
  /** Returns the form and the card to what storage holds. */
  onDiscard: () => void;
};

/**
 * The Profile page's save bar: docked to the bottom edge of the viewport for
 * as long as the learner's card has unsaved changes.
 *
 * @remarks
 * The page is long enough that an inline pair of buttons scrolls out of reach
 * while the learner is still editing, so the controls come to them instead.
 * They exist only when they can do something: nothing is drawn for a card with
 * nothing edited, which is also why the page no longer carries a disabled
 * Discard.
 *
 * After a save the controls give way to the confirmation, announced as a
 * status, and the bar stays until the next edit raises the controls again.
 *
 * The bar clears the iPhone's home indicator by adding the bottom safe-area
 * inset to its own padding, rather than by sitting above it.
 *
 * It is as wide as the Profile page's own column, so the controls sit under
 * the content they act on rather than under the window.
 *
 * @example
 * ```tsx
 * <ProfileSaveBar
 *   state={isSaved ? "saved" : isDirty ? "unsaved" : "clean"}
 *   canSave={hasName}
 *   onSave={handleSave}
 *   onDiscard={discard}
 * />
 * ```
 *
 * @category Components
 */
export function ProfileSaveBar({ state, canSave, onSave, onDiscard }: ProfileSaveBarProps) {
  const t = useTranslations("Profile");

  if (state === "clean") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-8 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-11">
      <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-card/95 px-4 py-3 shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur sm:px-5">
        {state === "saved" ? (
          <p
            role="status"
            className="flex items-center gap-2.5 text-sm font-semibold text-foreground motion-safe:animate-in motion-safe:fade-in-0"
          >
            <Check
              aria-hidden="true"
              className="size-4 text-gold"
              strokeWidth={2.75}
            />
            {t("saved")}
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold text-amber">{t("saveBar.unsaved")}</p>
            <div className="flex flex-1 flex-wrap justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onDiscard}
                className="min-h-12 px-5 text-[0.9375rem] font-bold"
              >
                {t("discard")}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={!canSave || state === "saving"}
                className="min-h-12 px-6 text-[0.9375rem] font-bold"
              >
                {t("save")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
