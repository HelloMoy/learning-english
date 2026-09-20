// @vitest-environment node
import { faker } from "@faker-js/faker";
import { render, toPlainText } from "react-email";
import { describe, expect, test } from "vitest";

import VerifyEmail from "./verify-email";

const copy = {
  preview: "One click and your account is ready.",
  heading: "Confirm your email",
  body: "You signed up with this address.",
  button: "Confirm my email",
  linkIntro: "Or paste this link into your browser:",
  ignore: "If you did not sign up, ignore this email.",
};

describe("VerifyEmail", () => {
  test("carries its one link as a button and as text", async () => {
    const url = faker.internet.url();

    const html = await render(
      <VerifyEmail
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
      <VerifyEmail
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
        <VerifyEmail
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
    expect(VerifyEmail.PreviewProps.url).toMatch(/^https?:\/\//);
  });
});
