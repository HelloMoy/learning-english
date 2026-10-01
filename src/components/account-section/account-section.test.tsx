import type { LearnerAccountIdentity } from "@/lib/account-identity/account-identity";
import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AccountSection } from "./account-section";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { changePassword: vi.fn(), changeEmail: vi.fn() },
}));

const copy = MESSAGES.en.Profile;

const anAccount = (
  signInMethods: LearnerAccountIdentity["signInMethods"],
): LearnerAccountIdentity => ({
  name: "Ana García",
  email: "ana@example.com",
  signInMethods,
});

beforeEach(() => {
  localizeGetPathname();
});

const renderSection = (account: LearnerAccountIdentity, locale: "en" | "es" | "pt" = "en") =>
  renderInLocale(<AccountSection account={account} />, locale);

const row = MESSAGES.en.Components.AccountRow;

const changeButton = (label: string) =>
  screen.getByRole("button", { name: `${row.change} ${label}` });

describe("AccountSection", () => {
  test("WHEN the learner signs in with a password THEN the address and a masked password are rows, both closed", () => {
    renderSection(anAccount(["password"]));

    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("••••••••")).toBeInTheDocument();
    expect(screen.getByText(copy.account.methodPassword)).toBeInTheDocument();
    expect(changeButton(copy.account.emailLabel)).toHaveAttribute("aria-expanded", "false");
    expect(changeButton(copy.account.passwordLabel)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: copy.password.heading })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.email.heading })).not.toBeInTheDocument();
  });

  test("WHEN the password row is opened THEN the change-password form appears", async () => {
    const user = userEvent.setup();
    renderSection(anAccount(["password"]));

    await user.click(changeButton(copy.account.passwordLabel));

    expect(screen.getByRole("heading", { name: copy.password.heading })).toBeVisible();
    expect(screen.getByLabelText(copy.password.currentLabel)).toBeVisible();
  });

  test("WHEN the address row is opened THEN the only editable address is the change-email field", async () => {
    const user = userEvent.setup();
    renderSection(anAccount(["password"]));
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);

    await user.click(changeButton(copy.account.emailLabel));

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveAccessibleName(copy.email.newLabel);
  });

  test("WHEN the learner only ever used Google THEN the address is a plain row and neither form is offered", () => {
    renderSection(anAccount(["google"]));

    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText(copy.account.methodGoogle)).toBeInTheDocument();
    expect(screen.getByText(copy.account.googleManaged)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("••••••••")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.password.heading })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.email.heading })).not.toBeInTheDocument();
  });

  test("WHEN both methods are linked THEN both are named and both rows are offered", () => {
    renderSection(anAccount(["password", "google"]));

    expect(screen.getByText(copy.account.methodPassword)).toBeInTheDocument();
    expect(screen.getByText(copy.account.methodGoogle)).toBeInTheDocument();
    expect(screen.queryByText(copy.account.googleManaged)).not.toBeInTheDocument();
    expect(changeButton(copy.account.emailLabel)).toBeInTheDocument();
    expect(changeButton(copy.account.passwordLabel)).toBeInTheDocument();
  });

  test("WHEN it renders in Portuguese THEN its own copy comes from the Portuguese catalogue", () => {
    renderSection(anAccount(["password"]), "pt");

    const portuguese = MESSAGES.pt.Profile.account;
    const portugueseRow = MESSAGES.pt.Components.AccountRow;
    expect(
      screen.getByText(portuguese.emailLabel, { ignore: "script, style, .sr-only" }),
    ).toBeInTheDocument();
    expect(screen.getByText(portuguese.methodsLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `${portugueseRow.change} ${portuguese.passwordLabel}` }),
    ).toBeInTheDocument();
  });

  test("WHEN it renders THEN it brings no heading of its own — the page's section owns it", () => {
    renderSection(anAccount(["password"]));

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText(copy.account.heading)).not.toBeInTheDocument();
  });
});
