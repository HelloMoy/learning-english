"use client";

import { UnmarkLessonModal } from "@/components/modals/unmark-lesson-modal/unmark-lesson-modal";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { LessonId } from "@/domain/entities/ids/ids";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import {
  markLessonComplete,
  unmarkLessonComplete,
  useLessonCompletion,
} from "@/hooks/use-lesson-completion/use-lesson-completion";
import { celebrateLessonCompletion } from "@/lib/celebrate-completion/celebrate-completion";

import NiceModal from "@ebay/nice-modal-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * The lesson's completion control, in both of its states — and in the third
 * one, which says nothing.
 *
 * @remarks
 * Its state is read from the durable browser store, not from local state
 * seeded to `false` — a lesson completed last week shows as completed on
 * arrival, and a mark survives a reload and a server restart.
 *
 * **Before the browser has read that store, neither state is true.** The
 * control used to render the invitation across that window, which told a
 * learner who had already finished the lesson something false about their own
 * progress — and did it in the page's closing call to action, the last thing
 * they look at. It now reserves the control's space instead, and commits to a
 * state only once there is one. Every other progress-bearing component in this
 * codebase already refuses to assert what it cannot justify; this is that rule
 * applied to the loudest of them.
 *
 * While the lesson is incomplete it invites the learner to finish it and
 * offers the primary "Mark as complete" button. Once complete it says so
 * once — the statement is the `aria-live` region that announces the change —
 * and offers a quiet "Unmark" action instead. Completion is never expressed
 * by disabling a control: a learner who marked a lesson by accident, or who
 * wants to take it again, must be able to undo it.
 *
 * **The click writes to two places, on purpose.** It records the lesson in
 * the browser `ProgressTracker`, which is what the outline and video-list
 * indicators read, and it still calls the `markLessonComplete` Server
 * Action against the server's in-memory tracker. The Server Action is not
 * dead code: it is the path per-user progress will take when auth lands, so
 * that migration becomes a change of caller rather than a rewrite. Until
 * then the server write is ephemeral and nothing reads it back.
 *
 * A confirmed mark is celebrated — the same burst the finish rule fires when
 * playback reaches the end of the lesson, since both are the same moment to
 * the learner. A rejected write records nothing and so celebrates nothing,
 * and un-marking never celebrates.
 *
 * The control is a Client Component because it owns a transition and reads
 * browser storage.
 *
 * `markComplete` is injected rather than imported so the component stays
 * testable without a server. Its type is written structurally — the
 * `{ data }` envelope is what `next-safe-action` resolves to, but naming
 * that library's types here would drag a server concern into the view. A
 * result without `data` means validation rejected the input, so the control
 * stays in the state it was in and nothing is recorded.
 *
 * @param lessonId - The lesson this control marks and un-marks
 * @param markComplete - The Server Action that records the completion
 * @param unmarkComplete - The Server Action that clears it, run only after
 *                         the learner confirms in {@link UnmarkLessonModal}
 */
export function LessonCompletionToggle({
  lessonId,
  markComplete,
  unmarkComplete,
}: {
  lessonId: LessonId;
  markComplete: (input: {
    lessonId: LessonId;
  }) => Promise<{ data?: { completed: boolean } } | undefined>;
  unmarkComplete: (input: {
    lessonId: LessonId;
  }) => Promise<{ data?: { unmarked: boolean } } | undefined>;
}) {
  const t = useTranslations("Components.LessonCompletionToggle");
  const completed = useLessonCompletion(lessonId);
  // Completion lives in `localStorage`, which the server cannot read. Until the
  // browser has, the control knows neither state — and rendering the incomplete
  // one tells a learner who already finished the lesson something false, in the
  // page's closing call to action, where it is least likely to go unnoticed.
  const isHydrated = useIsHydrated();
  const [isPending, startTransition] = useTransition();

  const onMark = () => {
    startTransition(async () => {
      const result = await markComplete({ lessonId });
      if (result?.data?.completed === true) {
        await markLessonComplete(lessonId);
        void celebrateLessonCompletion();
      }
    });
  };

  const onUnmark = async () => {
    const confirmed = await NiceModal.show(UnmarkLessonModal);
    if (confirmed !== true) return;
    startTransition(async () => {
      const result = await unmarkComplete({ lessonId });
      if (result?.data?.unmarked === true) {
        await unmarkLessonComplete(lessonId);
      }
    });
  };

  if (!isHydrated) {
    return <UnknownState />;
  }

  if (completed) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p
          aria-live="polite"
          className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span aria-hidden="true">✓</span>
          {t("completed")}
        </p>
        <button
          type="button"
          onClick={() => void onUnmark()}
          disabled={isPending}
          className="inline-flex min-h-11 shrink-0 items-center text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("unmark")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2 lg:items-start">
      <p className="text-sm text-pretty text-muted-foreground lg:hidden">{t("prompt")}</p>
      <button
        type="button"
        onClick={onMark}
        disabled={isPending}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
      >
        <span aria-hidden="true">✓</span>
        {t("markComplete")}
      </button>
    </div>
  );
}

/**
 * The control's shape, held while completion is still unknown.
 *
 * @remarks
 * Sized against the incomplete state — the taller of the two — so the closing
 * card does not change height when the real control resolves. Silent and
 * unfocusable: there is nothing here to announce and nothing to press, and a
 * tab stop on a placeholder would strand a keyboard learner on it.
 */
function UnknownState() {
  return (
    <div
      data-testid="lesson-completion-toggle-skeleton"
      aria-hidden="true"
      className="flex flex-col items-stretch gap-2 lg:items-start"
    >
      <Skeleton className="h-5 w-3/4 max-w-xs lg:hidden" />
      <Skeleton className="h-11 w-full rounded-lg lg:w-44" />
    </div>
  );
}
