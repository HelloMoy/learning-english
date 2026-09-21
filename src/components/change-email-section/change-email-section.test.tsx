import { authClient } from "@/lib/auth-client/auth-client";
import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ChangeEmailSection } from "./change-email-section";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { changeEmail: vi.fn() },
}));

const changeEmail = vi.mocked(authClient.changeEmail);

const CURRENT = "ana@example.com";
const copy = MESSAGES.en.Profile.email;

beforeEach(() => {
  changeEmail.mockReset();
  changeEmail.mockResolvedValue({ data: { status: true }, error: null } as never);
  localizeGetPathname();
});

const renderSection = (locale: "en" | "es" | "pt" = "en") =>
  renderInLocale(<ChangeEmailSection currentEmail={CURRENT} />, locale);

const submitAddress = async (address: string, label = copy.newLabel, submit = copy.submit) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(label), address);
  await user.click(screen.getByRole("button", { name: submit }));
};

describe("ChangeEmailSection", () => {
  test("WHEN it renders THEN it says where the first link goes before anything is typed", () => {
    renderSection();

    expect(screen.getByRole("heading", { name: copy.heading })).toBeInTheDocument();
    expect(screen.getByText(copy.description.replace("{email}", CURRENT))).toBeInTheDocument();
    expect(screen.getByLabelText(copy.newLabel)).toHaveAttribute("autocomplete", "email");
  });

  test("WHEN an address is submitted THEN the change is asked for with a callback into this locale's profile", async () => {
    renderSection("es");
    const spanish = MESSAGES.es.Profile.email;

    await submitAddress("ana.g@example.com", spanish.newLabel, spanish.submit);

    expect(changeEmail).toHaveBeenCalledWith(
      { newEmail: "ana.g@example.com", callbackURL: "/es/profile" },
      { headers: { "x-app-locale": "es" } },
    );
  });

  test("WHEN the request is accepted THEN the form gives way to a confirmation naming the address on file", async () => {
    renderSection();

    await submitAddress("ana.g@example.com");

    const confirmation = await screen.findByRole("status");
    expect(confirmation).toHaveTextContent(copy.sent.replace("{email}", CURRENT));
    // The new address is not announced: the learner has not proved it is theirs.
    expect(screen.queryByLabelText(copy.newLabel)).not.toBeInTheDocument();
  });

  test("WHEN the address is malformed THEN nothing is sent and the field says why", async () => {
    renderSection();

    await submitAddress("not-an-address");

    expect(changeEmail).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      MESSAGES.en.Account.validation.emailInvalid,
    );
  });

  test("WHEN the address is the one the account already holds THEN nothing is sent", async () => {
    renderSection();

    await submitAddress(CURRENT.toUpperCase());

    expect(changeEmail).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      MESSAGES.en.Account.validation.emailUnchanged,
    );
  });

  test("WHEN the server refuses THEN the refusal is an alert and the field keeps what was typed", async () => {
    changeEmail.mockResolvedValue({ data: null, error: { status: 429 } } as never);
    renderSection();

    await submitAddress("ana.g@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MESSAGES.en.Account.errors.tooManyRequests,
    );
    expect(screen.getByLabelText(copy.newLabel)).toHaveValue("ana.g@example.com");
  });

  test("WHEN it renders in Portuguese THEN every string comes from the Portuguese catalogue", () => {
    renderSection("pt");

    const portuguese = MESSAGES.pt.Profile.email;
    expect(screen.getByRole("heading", { name: portuguese.heading })).toBeInTheDocument();
    expect(screen.getByLabelText(portuguese.newLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: portuguese.submit })).toBeInTheDocument();
  });
});
