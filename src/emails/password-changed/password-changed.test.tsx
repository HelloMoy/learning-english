// @vitest-environment node
import { faker } from "@faker-js/faker";
import { render, toPlainText } from "react-email";
import { describe, expect, test } from "vitest";

import PasswordChanged from "./password-changed";

const copy = {
  preview: "If this was not you, recover your account now.",
  heading: "Your password was changed",
  body: "The password for your account was just changed, and every other device was signed out.",
  button: "I did not do this",
  linkIntro: "Or paste this link into your browser:",
  ignore: "If it was not you, someone else has your password. Choose a new one straight away.",
};

const RECOVERY = "https://english-course.online/es/forgot-password";

describe("PasswordChanged", () => {
  test("carries its one link as a button and as text", async () => {
    const url = faker.internet.url();

    const html = await render(
      <PasswordChanged
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
      <PasswordChanged
        lang="es"
        copy={copy}
        url={RECOVERY}
      />,
    );

    for (const line of Object.values(copy)) expect(html).toContain(line);
    expect(html).toContain('lang="es"');
  });

  test("reads as plain text with the link intact", async () => {
    const text = toPlainText(
      await render(
        <PasswordChanged
          lang="en"
          copy={copy}
          url={RECOVERY}
        />,
      ),
    );

    expect(text).toContain(copy.body);
    expect(text).toContain(RECOVERY);
  });

  test("declares preview props so the preview server renders it alone", () => {
    expect(PasswordChanged.PreviewProps.url).toMatch(/^https?:\/\//);
  });

  describe("GIVEN a notice whose reader may be the intruder", () => {
    test("WHEN it is rendered THEN it carries nothing that opens the account", async () => {
      // A ready-made reset key in this email would complete the takeover it warns about.
      const html = await render(
        <PasswordChanged
          lang="en"
          copy={copy}
          url={RECOVERY}
        />,
      );

      expect(html).not.toContain("token");
      expect(toPlainText(html)).not.toContain("token");
      expect(PasswordChanged.PreviewProps.url).not.toContain("token");
    });

    test("WHEN it is rendered THEN its call to action is the gold primary", async () => {
      const html = await render(
        <PasswordChanged
          lang="en"
          copy={copy}
          url={RECOVERY}
        />,
      );

      expect(html).toContain("background-color:#e7b64c");
      expect(html).toContain("color:#1a1200");
    });
  });
});
