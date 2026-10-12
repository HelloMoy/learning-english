import { NOT_CAPTURED_CLASS } from "@/lib/product-analytics-options/product-analytics-options";
import { cn } from "@/lib/utils/utils";

/**
 * Props for {@link AccountConfirmation}.
 */
export type AccountConfirmationProps = {
  title: string;
  /** What happened and what to do next, announced when it appears. */
  message: string;
  /** The message names the learner's address, so it is kept out of usage data. */
  personal?: boolean;
  /** An optional way on, such as a link to request a new email. */
  action?: React.ReactNode;
};

/**
 * What an account form turns into once there is nothing left to fill in:
 * "check your inbox" after sign-up or a reset request, or "this link no
 * longer works" for a spent reset link. The message is a status region, so it
 * is announced when it replaces the form.
 *
 * @example
 * ```tsx
 * <AccountConfirmation title={t("checkInboxTitle")} message={t("checkInboxBody", { email })} personal />
 * ```
 */
export function AccountConfirmation({
  title,
  message,
  personal = false,
  action,
}: AccountConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p
        role="status"
        className={cn("text-sm text-pretty text-muted-foreground", personal && NOT_CAPTURED_CLASS)}
      >
        {message}
      </p>
      {action}
    </div>
  );
}
