"use client";

import { cn } from "@/lib/utils/utils";

import { createContext, use, type ReactNode } from "react";

/** Whether the surface this part belongs to has a request in flight. */
const WaitingContext = createContext(false);

/**
 * Whether the nearest {@link AccountWait} has a request in flight.
 *
 * @remarks
 * Returns `false` outside an `AccountWait`, so a component can consult the
 * surrounding wait without requiring one. `AccountSubmitArea` uses it to keep
 * its button in flight for waits that outlast their request — sign-in's, which
 * continues into the navigation after the credentials are accepted.
 *
 * @returns `true` while the surrounding surface is waiting
 */
export const useIsWaiting = () => use(WaitingContext);

/**
 * Props for {@link AccountWait}.
 */
export type AccountWaitProps = {
  /** Whether the surface's request is in flight. */
  busy: boolean;
  children: ReactNode;
};

/**
 * The wait an account surface shows while its request is in flight.
 *
 * @remarks
 * The root renders the beam and shares `busy` with its parts; it adds no
 * wrapper of its own, so it never disturbs the caller's layout and the beam
 * pins itself to the nearest positioned ancestor — the account card, which is
 * why `AccountShell` is `relative overflow-hidden`.
 *
 * @example
 * ```tsx
 * <AccountWait busy={submission.isPending}>
 *   <AccountWait.Paused className="flex flex-col gap-4">{fields}</AccountWait.Paused>
 *   <AccountSubmitArea submission={submission} … />
 *   <AccountWait.Status>{t("signIn.waiting")}</AccountWait.Status>
 * </AccountWait>
 * ```
 *
 * @category Components
 */
export function AccountWait({ busy, children }: AccountWaitProps) {
  return (
    <WaitingContext value={busy}>
      {busy ? (
        <span
          aria-hidden="true"
          data-testid="account-wait-beam"
          className="account-wait-beam absolute inset-x-0 top-0 h-[3px]"
        />
      ) : null}
      {children}
    </WaitingContext>
  );
}

/**
 * Props for {@link AccountWait.Paused}.
 */
export type AccountWaitPausedProps = {
  /**
   * The caller's own layout for this group — the fields sit inside a new
   * element, so whatever spacing held them together has to come with them.
   */
  className?: string;
  children: ReactNode;
};

/**
 * The part of the surface that is out of play while the request is in flight:
 * dimmed, and `inert` so nothing inside can be clicked, focused, tabbed into or
 * read by assistive technology.
 *
 * @remarks
 * The children are never unmounted, which is the point — a refusal leaves the
 * learner looking at their own typing rather than at an empty form, and a fast
 * response cannot produce a flash of relayout.
 *
 * The submit button belongs *outside* this region: it has to stay lit for its
 * arc and pending label to be visible, and it holds the disabled state itself.
 */
function Paused({ className, children }: AccountWaitPausedProps) {
  const isWaiting = useIsWaiting();

  return (
    <div
      inert={isWaiting}
      data-testid="account-wait-paused"
      data-state={isWaiting ? "paused" : "live"}
      className={cn(
        "transition-[opacity,filter] duration-300",
        isWaiting && "opacity-45 saturate-50",
        className,
      )}
    >
      {children}
    </div>
  );
}

AccountWait.Paused = Paused;

/**
 * Props for {@link AccountWait.Status}.
 */
export type AccountWaitStatusProps = {
  /** The sentence naming the work being waited on, from the caller's namespace. */
  children: ReactNode;
};

/**
 * The one thing a waiting surface says: the sentence naming the work, shown
 * beside the button and announced once.
 *
 * @remarks
 * The live region is mounted whether or not a request is in flight, and is
 * empty at rest. A live region inserted into the document together with its
 * text is not reliably announced; one that is already in the tree and then
 * filled is. Being `sr-only`, an empty region is out of flow and adds no gap.
 *
 * The visible copy carries the same sentence and is `aria-hidden`, so the wait
 * is read once rather than twice, and what is announced is what anyone
 * watching the screen reads.
 */
function Status({ children }: AccountWaitStatusProps) {
  const isWaiting = useIsWaiting();

  return (
    <>
      {isWaiting ? (
        <p
          aria-hidden="true"
          data-testid="account-wait-status"
          className="text-center text-sm font-medium text-gold"
        >
          {children}
        </p>
      ) : null}
      <span
        role="status"
        className="sr-only"
      >
        {isWaiting ? children : null}
      </span>
    </>
  );
}

AccountWait.Status = Status;
