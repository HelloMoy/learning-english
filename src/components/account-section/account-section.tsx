"use client";

import { AccountRow } from "@/components/account-row/account-row";
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

/** What a password row shows: the password is never known, only that there is one. */
const MASKED_PASSWORD = "••••••••";

/**
 * The Profile page's sign-in and security settings: the address the learner
 * is registered with, their password, and how they sign in.
 *
 * @remarks
 * It carries no heading of its own: the page wraps it in a `ProfileSection`,
 * which owns the `h2` and the region, so every section of the page is titled
 * the same way.
 *
 * For an account with a password, the address and the password are each an
 * {@link AccountRow} that opens its change form in place. Both start closed,
 * so the page is short for the learners who never change either.
 *
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
 * <ProfileSection title={t("account.heading")}>
 *   <AccountSection account={account} />
 * </ProfileSection>
 * ```
 *
 * @category Components
 */
export function AccountSection({ account }: AccountSectionProps) {
  const t = useTranslations("Profile.account");
  const hasPassword = account.signInMethods.includes("password");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {hasPassword ? (
          <>
            <AccountRow
              label={t("emailLabel")}
              value={account.email}
            >
              <ChangeEmailSection currentEmail={account.email} />
            </AccountRow>
            <AccountRow
              label={t("passwordLabel")}
              value={MASKED_PASSWORD}
            >
              <ChangePasswordSection />
            </AccountRow>
          </>
        ) : (
          <AccountRow
            label={t("emailLabel")}
            value={account.email}
          />
        )}
        <SignInMethods methods={account.signInMethods} />
      </div>
      {hasPassword ? null : <p className="text-sm text-muted-foreground">{t("googleManaged")}</p>}
    </div>
  );
}

/** The row naming every way the learner signs in, one chip each. */
function SignInMethods({ methods }: { methods: ReadonlyArray<SignInMethod> }) {
  const t = useTranslations("Profile.account");

  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
      <span className="text-[0.9375rem] font-semibold text-foreground">{t("methodsLabel")}</span>
      <ul className="flex flex-wrap gap-2">
        {methods.map((method) => (
          <li
            key={method}
            className="rounded-full border border-border bg-foreground/5 px-3 py-1 text-[0.8125rem] font-semibold text-foreground"
          >
            {t(METHOD_KEYS[method])}
          </li>
        ))}
      </ul>
    </div>
  );
}
