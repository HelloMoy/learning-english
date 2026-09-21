"use client";

import { ChangeEmailSection } from "@/components/change-email-section/change-email-section";
import { ChangePasswordSection } from "@/components/change-password-section/change-password-section";
import type { LearnerAccountIdentity, SignInMethod } from "@/lib/account-identity/account-identity";

import { useTranslations } from "next-intl";

/**
 * Props for {@link AccountSection}.
 */
export type AccountSectionProps = {
  /** Who the learner is to their account, from `currentAccount()` on the server. */
  account: LearnerAccountIdentity;
};

const METHOD_KEYS: Readonly<Record<SignInMethod, "methodPassword" | "methodGoogle">> = {
  password: "methodPassword",
  google: "methodGoogle",
};

/**
 * The Profile page's account settings: the address the learner is registered
 * with, how they sign in, and — when the account has a password — the forms
 * that change each.
 *
 * @remarks
 * The address is printed, not put in a field: the only editable address on the
 * page belongs to {@link ChangeEmailSection}, so nothing invites a learner to
 * type over the one on file and wonder why it did not save.
 *
 * An account that only signs in with Google has no password to authorize a
 * change with and no address of its own, so it is told where its address comes
 * from and offered neither form.
 *
 * @example
 * ```tsx
 * <AccountSection account={account} />
 * ```
 *
 * @category Components
 */
export function AccountSection({ account }: AccountSectionProps) {
  const t = useTranslations("Profile.account");
  const hasPassword = account.signInMethods.includes("password");

  return (
    <section
      aria-labelledby="account-heading"
      className="flex flex-col gap-6 border-t border-border pt-8"
    >
      <div className="flex flex-col gap-3">
        <h2
          id="account-heading"
          className="text-lg font-bold text-foreground"
        >
          {t("heading")}
        </h2>
        <Detail label={t("emailLabel")}>
          <p className="text-[0.9375rem] text-foreground">{account.email}</p>
        </Detail>
        <Detail label={t("methodsLabel")}>
          <ul className="flex flex-wrap gap-2">
            {account.signInMethods.map((method) => (
              <li
                key={method}
                className="rounded-full border border-border bg-foreground/5 px-3 py-1 text-[0.8125rem] font-semibold text-foreground"
              >
                {t(METHOD_KEYS[method])}
              </li>
            ))}
          </ul>
        </Detail>
        {hasPassword ? null : <p className="text-sm text-muted-foreground">{t("googleManaged")}</p>}
      </div>
      {hasPassword ? (
        <>
          <ChangePasswordSection />
          <ChangeEmailSection currentEmail={account.email} />
        </>
      ) : null}
    </section>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
