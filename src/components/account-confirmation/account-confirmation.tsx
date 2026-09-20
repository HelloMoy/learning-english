/**
 * Props for {@link AccountConfirmation}.
 */
export type AccountConfirmationProps = {
  title: string;
  /** What happened and what to do next, announced when it appears. */
  message: string;
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
 * <AccountConfirmation title={t("checkInboxTitle")} message={t("checkInboxBody", { email })} />
 * ```
 */
export function AccountConfirmation({ title, message, action }: AccountConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p
        role="status"
        className="text-sm text-pretty text-muted-foreground"
      >
        {message}
      </p>
      {action}
    </div>
  );
}
