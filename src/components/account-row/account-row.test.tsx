import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { AccountRow } from "./account-row";

let label: string;
let value: string;

beforeEach(() => {
  label = `${faker.word.adjective()} ${faker.word.noun()}`;
  value = faker.internet.email();
});

const renderRow = (locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <AccountRow
      label={label}
      value={value}
    >
      <label>
        New value
        <input type="text" />
      </label>
    </AccountRow>,
    locale,
  );

const changeButton = () => screen.getByRole("button", { name: `Change ${label}` });

describe("AccountRow", () => {
  test("WHEN it renders THEN it names what it holds and its current value", () => {
    renderRow();

    expect(screen.getByText(label, { ignore: "script, style, .sr-only" })).toBeInTheDocument();
    expect(screen.getByText(value)).toBeInTheDocument();
  });

  test("WHEN it first renders THEN it is closed and its content is hidden", () => {
    renderRow();

    expect(changeButton()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("New value")).not.toBeVisible();
  });

  test("WHEN Change is pressed THEN the row opens and offers to close", async () => {
    const user = userEvent.setup();
    renderRow();

    await user.click(changeButton());

    const closeButton = screen.getByRole("button", { name: `Close ${label}` });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("New value")).toBeVisible();
  });

  test("WHEN the row is closed and opened again THEN what was typed is still there", async () => {
    const user = userEvent.setup();
    const typed = faker.lorem.word();
    renderRow();

    await user.click(changeButton());
    await user.type(screen.getByLabelText("New value"), typed);
    await user.click(screen.getByRole("button", { name: `Close ${label}` }));
    await user.click(changeButton());

    expect(screen.getByLabelText("New value")).toHaveValue(typed);
  });

  test("WHEN the button controls the content THEN it points at it", () => {
    renderRow();

    const regionId = changeButton().getAttribute("aria-controls");
    expect(document.getElementById(regionId ?? "")).toContainElement(
      screen.getByLabelText("New value"),
    );
  });

  test("WHEN there is nothing to change THEN the row is plain text with no button", () => {
    renderInLocale(
      <AccountRow
        label={label}
        value={value}
      />,
    );

    expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("WHEN it renders in Spanish THEN the button reads Cambiar", () => {
    renderRow("es");

    expect(screen.getByRole("button", { name: `Cambiar ${label}` })).toBeInTheDocument();
  });
});
