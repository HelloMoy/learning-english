"use client";

import { DeleteAccountModal } from "@/components/modals/delete-account-modal/delete-account-modal";
import { Button } from "@/components/ui/button/button";
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
 * The button opens {@link DeleteAccountModal}. Confirming there asks Better
 * Auth for a confirmation email whose link returns to this locale's
 * account-deleted page; nothing is deleted until the learner opens that link
 * while signed in. The section then announces the email as a status, or a
 * refused request as an alert.
 *
 * Needs a `NiceModal.Provider` above it, which the app's global providers
 * mount.
 *
 * @example
 * ```tsx
 * <DeleteAccountSection />
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
    <section
      aria-labelledby="delete-account-heading"
      className="flex flex-col gap-3 border-t border-border pt-8"
    >
      <h2
        id="delete-account-heading"
        className="text-lg font-bold text-foreground"
      >
        {t("heading")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <Button
        type="button"
        variant="destructive"
        onClick={requestDeletion}
        disabled={status === "sending" || status === "sent"}
        className="min-h-11 self-start px-5 font-bold"
      >
        {status === "sending" ? t("sending") : t("button")}
      </Button>
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
    </section>
  );
}
