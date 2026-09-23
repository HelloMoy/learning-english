import type { LearnerAccountIdentity } from "@/lib/account-identity/account-identity";
import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";

import { screen } from "@testing-library/react";
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

describe("AccountSection", () => {
  test("WHEN the learner signs in with a password THEN the address is text and both forms are offered", () => {
    renderSection(anAccount(["password"]));

    expect(screen.getByText(copy.account.emailLabel)).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText(copy.account.methodPassword)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.password.heading })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.email.heading })).toBeInTheDocument();
  });

  test("WHEN the address is shown THEN it is not offered as something to edit in place", () => {
    renderSection(anAccount(["password"]));

    // The only editable address on the page is the change-email field.
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveAccessibleName(copy.email.newLabel);
  });

  test("WHEN the learner only ever used Google THEN neither form is offered", () => {
    renderSection(anAccount(["google"]));

    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText(copy.account.methodGoogle)).toBeInTheDocument();
    expect(screen.getByText(copy.account.googleManaged)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.password.heading })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.email.heading })).not.toBeInTheDocument();
  });

  test("WHEN both methods are linked THEN both are named and both forms are offered", () => {
    renderSection(anAccount(["password", "google"]));

    expect(screen.getByText(copy.account.methodPassword)).toBeInTheDocument();
    expect(screen.getByText(copy.account.methodGoogle)).toBeInTheDocument();
    expect(screen.queryByText(copy.account.googleManaged)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.password.heading })).toBeInTheDocument();
  });

  test("WHEN it renders in Portuguese THEN its own copy comes from the Portuguese catalogue", () => {
    renderSection(anAccount(["password"]), "pt");

    const portuguese = MESSAGES.pt.Profile.account;
    expect(screen.getByText(portuguese.emailLabel)).toBeInTheDocument();
    expect(screen.getByText(portuguese.methodsLabel)).toBeInTheDocument();
  });

  test("WHEN it renders THEN it brings no heading of its own — the page's section owns it", () => {
    renderSection(anAccount(["password"]));

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText(copy.account.heading)).not.toBeInTheDocument();
  });
});
