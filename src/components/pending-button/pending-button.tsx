import { SpinnerArc } from "@/components/spinner-arc/spinner-arc";
import { Button, type ButtonProps } from "@/components/ui/button/button";
import { cn } from "@/lib/utils/utils";

/**
 * Props for {@link PendingButton}.
 *
 * @remarks
 * Every {@link ButtonProps} except `children` passes through, so a caller keeps
 * its own `type`, `variant`, `size`, `onClick` and `className`. `disabled`
 * composes rather than competes: a button disabled for the caller's own reasons
 * stays disabled, and a request in flight disables it regardless.
 */
export type PendingButtonProps = Omit<ButtonProps, "children"> & {
  /** Whether the request this button started is in flight. */
  isPending: boolean;
  /** What the button says at rest. */
  label: string;
  /** What the button says while the request is in flight. */
  pendingLabel: string;
};

/**
 * The button an account surface waits on: at rest it is an ordinary
 * {@link Button}, and while its request is in flight it swaps its label and
 * turns a {@link SpinnerArc} beside it.
 *
 * @remarks
 * This is the single definition of an account action in flight. Both callers
 * use it — `AccountSubmitArea`, for the four account forms, and
 * `DeleteAccountSection`, which is not a form and drives `isPending` from its
 * own state — so the destructive action on the profile page waits exactly the
 * way signing in does.
 *
 * The button disables itself while pending, which is what actually prevents the
 * double submission; the arc only says so. The arc is hidden from assistive
 * technology, so the button's accessible name stays the pending label alone.
 *
 * A pending button keeps its full ink, overriding `Button`'s `disabled:opacity-50`.
 * The two disabled states mean different things and must not look alike: a
 * button that cannot be pressed *yet* — a Turnstile challenge still unsolved —
 * is dimmed, while a button that is *working* has to stay legible, or the arc
 * and the pending label fade out exactly when they are the only thing to read.
 *
 * @example
 * ```tsx
 * <PendingButton
 *   type="submit"
 *   isPending={submission.isPending}
 *   label={t("signIn.submit")}
 *   pendingLabel={t("signIn.submitting")}
 * />
 * ```
 *
 * @category Components
 */
export function PendingButton({
  isPending,
  label,
  pendingLabel,
  disabled,
  className,
  ...buttonProps
}: PendingButtonProps) {
  return (
    <Button
      {...buttonProps}
      disabled={disabled || isPending}
      className={cn(isPending && "disabled:opacity-100", className)}
    >
      {isPending ? (
        <>
          <SpinnerArc />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
