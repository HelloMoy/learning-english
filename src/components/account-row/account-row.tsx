"use client";

import { Button } from "@/components/ui/button/button";

import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

/**
 * Props for {@link AccountRow}.
 */
export type AccountRowProps = {
  /** What the row holds, e.g. "Email address" or "Password". */
  label: string;
  /** The current value, as text: the address, or a masked password. */
  value: string;
  /** What opens under the row to change the value; omitted, the row is plain text. */
  children?: ReactNode;
};

/**
 * One account detail on the Profile page: its label and current value, with a
 * Change button that opens the form for it in place.
 *
 * @remarks
 * The row starts closed so the page stays short; most learners never change
 * their address or password. The form under it stays mounted and is only
 * hidden, so closing the row keeps what was typed and keeps a confirmation
 * the form is showing.
 *
 * The button's accessible name carries the row's label ("Change Password"),
 * because a page with two rows would otherwise have two buttons named
 * "Change".
 *
 * @example
 * ```tsx
 * <AccountRow label={t("passwordLabel")} value="••••••••">
 *   <ChangePasswordSection />
 * </AccountRow>
 * ```
 *
 * @category Components
 */
export function AccountRow({ label, value, children }: AccountRowProps) {
  const t = useTranslations("Components.AccountRow");
  const regionId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const canChange = children !== undefined;

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 py-2">
        <span className="text-[0.9375rem] font-semibold text-foreground">{label}</span>
        <span className="min-w-0 flex-1 text-right text-[0.9375rem] [overflow-wrap:anywhere] text-muted-foreground">
          {value}
        </span>
        {canChange ? (
          <Button
            type="button"
            variant="outline"
            aria-expanded={isOpen}
            aria-controls={regionId}
            onClick={() => setIsOpen((open) => !open)}
            className="min-h-10 px-4 font-bold"
          >
            {isOpen ? t("close") : t("change")} <span className="sr-only">{label}</span>
          </Button>
        ) : null}
      </div>
      {canChange ? (
        <div
          id={regionId}
          hidden={!isOpen}
          className="pt-2 pb-6"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
