"use client";

import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import {
  resolveContinueWatchingPanel,
  type ResolveContinueWatching,
} from "@/app/[locale]/resolve-continue-watching";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { useContinueWatching } from "@/hooks/use-continue-watching/use-continue-watching";

import { useEffect, useState } from "react";

/**
 * What the stored continue-watching record resolves to.
 *
 * - `none` — no record, a record that no longer resolves, or a render that
 *   cannot read storage yet (the server and the hydration pass).
 * - `resolving` — a record exists and the round-trip that resolves it has not
 *   answered; the resume panel is reserved, naming no lesson.
 * - `resolved` — the record resolved to a live lesson. The stored lesson id
 *   rides along, because the panel carries none and the saved playback
 *   position is keyed by it.
 *
 * @category Utilities
 */
export type ResolvedContinueWatching =
  | { status: "none" }
  | { status: "resolving" }
  | { status: "resolved"; panel: ContinueWatchingPanel; lessonId: LessonId };

/**
 * Reads the stored continue-watching record and resolves it into a panel.
 *
 * @remarks
 * It starts as `none` because that is what the server rendered, so hydration
 * never mismatches. Storage answers "a record exists" before the Server
 * Action answers "which lesson", and between the two the honest state is
 * `resolving` — not a guess in either direction.
 *
 * Browser-side only — the record lives in `localStorage`.
 *
 * @param options.continueWatching - Overrides the storage adapter; tests inject a fake
 * @param options.resolve - Overrides the resolver; defaults to the Server Action
 * @returns The record's current resolution
 *
 * @example
 * ```tsx
 * const lastLesson = useResolvedContinueWatching();
 * if (lastLesson.status === "resolved") return <ResumePanel panel={lastLesson.panel} />;
 * ```
 */
export function useResolvedContinueWatching({
  continueWatching,
  resolve = resolveContinueWatchingPanel,
}: {
  continueWatching?: ContinueWatchingRepository;
  resolve?: ResolveContinueWatching;
} = {}): ResolvedContinueWatching {
  const locations = useContinueWatching(continueWatching);
  const [state, setState] = useState<ResolvedContinueWatching>({ status: "none" });

  useEffect(() => {
    let isCurrent = true;
    void locations.get().then(async (location) => {
      if (!location || !isCurrent) return;
      setState({ status: "resolving" });
      const panel = await resolve(location);
      if (isCurrent) {
        setState(
          panel ? { status: "resolved", panel, lessonId: location.lessonId } : { status: "none" },
        );
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [locations, resolve]);

  return state;
}
