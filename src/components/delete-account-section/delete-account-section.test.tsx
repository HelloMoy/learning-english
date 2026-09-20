import { authClient } from "@/lib/auth-client/auth-client";
import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";

import NiceModal from "@ebay/nice-modal-react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { DeleteAccountSection } from "./delete-account-section";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { deleteUser: vi.fn() },
}));

const deleteUser = vi.mocked(authClient.deleteUser);

beforeEach(() => {
  deleteUser.mockReset();
  deleteUser.mockResolvedValue({ data: { success: true }, error: null } as never);
  localizeGetPathname();
});

const renderSection = (locale: "en" | "es" | "pt" = "en") =>
  renderInLocale(
    <NiceModal.Provider>
      <DeleteAccountSection />
    </NiceModal.Provider>,
    locale,
  );

const confirmDeletion = async (copy = MESSAGES.en.Profile.deleteAccount) => {
  await userEvent.click(screen.getByRole("button", { name: copy.button }));
  await userEvent.click(await screen.findByRole("button", { name: copy.confirm }));
};

describe("DeleteAccountSection", () => {
  test("WHEN it renders in Portuguese THEN its heading and button come from pt", () => {
    renderSection("pt");

    const copy = MESSAGES.pt.Profile.deleteAccount;
    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.button })).toBeInTheDocument();
  });

  test("WHEN the learner cancels THEN nothing is requested", async () => {
    renderSection();
    const copy = MESSAGES.en.Profile.deleteAccount;

    await userEvent.click(screen.getByRole("button", { name: copy.button }));
    await userEvent.click(await screen.findByRole("button", { name: copy.cancel }));

    expect(deleteUser).not.toHaveBeenCalled();
  });

  test("WHEN the learner confirms THEN deletion is requested back to this locale's account-deleted page", async () => {
    renderSection("es");

    await confirmDeletion(MESSAGES.es.Profile.deleteAccount);

    expect(deleteUser).toHaveBeenCalledWith({ callbackURL: "/es/account-deleted" });
  });

  test("WHEN the request is accepted THEN the section announces the email", async () => {
    renderSection();

    await confirmDeletion();

    expect(await screen.findByRole("status")).toHaveTextContent(
      MESSAGES.en.Profile.deleteAccount.sent,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("WHEN the request is refused THEN the section says so", async () => {
    deleteUser.mockResolvedValue({ data: null, error: { status: 500 } } as never);
    renderSection();

    await confirmDeletion();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MESSAGES.en.Profile.deleteAccount.error,
    );
  });
});
