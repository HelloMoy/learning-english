// @vitest-environment node
import { faker } from "@faker-js/faker";
import { render, toPlainText } from "react-email";
import { describe, expect, test } from "vitest";

import ChangeEmail from "./change-email";

const copy = {
  preview: "Your address stays the same until you approve this.",
  heading: "Approve your new email address",
  body: "Someone asked to move this account to ana.g@example.com.",
  button: "Approve the change",
  linkIntro: "Or paste this link into your browser:",
  ignore: "If you did not ask for this, your address stays as it is.",
};

describe("ChangeEmail", () => {
  test("carries its one link as a button and as text", async () => {
    const url = faker.internet.url();

    const html = await render(
      <ChangeEmail
        lang="en"
        copy={copy}
        url={url}
      />,
    );

    expect(html).toContain(`href="${url}"`);
    expect(html).toContain(copy.button);
    expect(html.split(url).length - 1).toBeGreaterThanOrEqual(2);
  });

  test("names the new address and says ignoring it changes nothing", async () => {
    const html = await render(
      <ChangeEmail
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
        <ChangeEmail
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
    expect(ChangeEmail.PreviewProps.url).toMatch(/^https?:\/\//);
  });

  describe("GIVEN a link the learner can ask for again", () => {
    test("WHEN the email is rendered THEN its call to action is the gold primary", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <ChangeEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      expect(html).toContain("background-color:#e7b64c");
      expect(html).toContain("color:#1a1200");
    });
  });
});
