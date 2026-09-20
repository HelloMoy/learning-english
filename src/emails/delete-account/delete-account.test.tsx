// @vitest-environment node
import { faker } from "@faker-js/faker";
import { render, toPlainText } from "react-email";
import { describe, expect, test } from "vitest";

import DeleteAccount from "./delete-account";

const copy = {
  preview: "This permanently deletes your account.",
  heading: "Delete your account?",
  body: "Following this link deletes your account and your progress.",
  button: "Delete my account",
  linkIntro: "Or paste this link into your browser:",
  ignore: "If you did not ask for this, ignore this email.",
};

describe("DeleteAccount", () => {
  test("carries its one link as a button and as text", async () => {
    const url = faker.internet.url();

    const html = await render(
      <DeleteAccount
        lang="en"
        copy={copy}
        url={url}
      />,
    );

    expect(html).toContain(`href="${url}"`);
    expect(html).toContain(copy.button);
    expect(html.split(url).length - 1).toBeGreaterThanOrEqual(2);
  });

  test("renders every line of its copy and declares its language", async () => {
    const html = await render(
      <DeleteAccount
        lang="es"
        copy={copy}
        url={faker.internet.url()}
      />,
    );

    for (const line of Object.values(copy)) expect(html).toContain(line);
    expect(html).toContain('lang="es"');
  });

  test("reads as plain text with the link intact", async () => {
    const url = faker.internet.url();

    const text = toPlainText(
      await render(
        <DeleteAccount
          lang="en"
          copy={copy}
          url={url}
        />,
      ),
    );

    expect(text).toContain(copy.body);
    expect(text).toContain(url);
  });

  test("declares preview props so the preview server renders it alone", () => {
    expect(DeleteAccount.PreviewProps.url).toMatch(/^https?:\/\//);
  });
});
