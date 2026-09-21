"use client";

import { AccountWait } from "@/components/account-wait/account-wait";
import { DeleteAccountModal } from "@/components/modals/delete-account-modal/delete-account-modal";
import { PendingButton } from "@/components/pending-button/pending-button";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";

import NiceModal from "@ebay/nice-modal-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type DeletionStatus = "idle" | "sending" | "sent" | "error";

/**
 * The last section of the Profile page: deletes the learner's account.
 *
 * @remarks
 * It carries neither heading nor description: the page wraps it in a
 * `ProfileSection`, which owns the `h2`, the supporting line and the region,
 * so the page's last section is titled like every other one.
 *
 * The button opens {@link DeleteAccountModal}. Confirming there asks Better
 * Auth for a confirmation email whose link returns to this locale's
 * account-deleted page; nothing is deleted until the learner opens that link
 * while signed in. The section then announces the email as a status, or a
 * refused request as an alert.
 *
 * The section waits the way every account form waits, through the same
 * {@link PendingButton} and {@link AccountWait} — its beam sweeps this
 * `<section>` rather than an account card. It keeps its own state machine
 * rather than adopting `useAccountSubmission`: it is not a form, it is
 * unchallenged, its errors live in its own namespace, and its `sent` state is
 * terminal in a way the hook has no concept of. There is no paused region
 * because there is nothing to pause — the section has no fields.
 *
 * Needs a `NiceModal.Provider` above it, which the app's global providers
 * mount.
 *
 * @example
 * ```tsx
 * <ProfileSection title={t("deleteAccount.heading")} note={t("deleteAccount.description")}>
 *   <DeleteAccountSection />
 * </ProfileSection>
 * ```
 *
 * @category Components
 */
export function DeleteAccountSection() {
  const t = useTranslations("Profile.deleteAccount");
  const locale = useLocale();
  const [status, setStatus] = useState<DeletionStatus>("idle");

  const requestDeletion = async () => {
    const confirmed = await NiceModal.show(DeleteAccountModal);
    if (!confirmed) return;
    setStatus("sending");
    const callbackURL = getPathname({ href: "/account-deleted", locale });
    const { error } = await authClient.deleteUser({ callbackURL });
    setStatus(error ? "error" : "sent");
  };

  return (
    <div className="relative flex flex-col gap-3 overflow-hidden">
      <AccountWait busy={status === "sending"}>
        <PendingButton
          type="button"
          variant="destructive"
          onClick={requestDeletion}
          isPending={status === "sending"}
          disabled={status === "sent"}
          className="min-h-11 self-start px-5 font-bold"
          label={t("button")}
          pendingLabel={t("sending")}
        />
        <AccountWait.Status>{t("waiting")}</AccountWait.Status>
        {status === "sent" ? (
          <p
            role="status"
            className="text-sm text-foreground"
          >
            {t("sent")}
          </p>
        ) : null}
        {status === "error" ? (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {t("error")}
          </p>
        ) : null}
      </AccountWait>
    </div>
  );
}
