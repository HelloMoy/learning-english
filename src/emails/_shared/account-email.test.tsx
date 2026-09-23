// @vitest-environment node
import { faker } from "@faker-js/faker";
import { render } from "react-email";
import { describe, expect, test } from "vitest";

import { AccountEmail } from "./account-email";

const copy = {
  preview: faker.lorem.sentence(),
  heading: faker.lorem.words(3),
  body: faker.lorem.sentence(),
  button: faker.lorem.words(2),
  linkIntro: faker.lorem.sentence(),
  ignore: faker.lorem.sentence(),
};

/*
 * The colour literals below are hardcoded on purpose. They are the contract
 * with the `.dark` block of `globals.css`: the test exists to catch the
 * palette drifting, so a faker value would test nothing.
 */
describe("AccountEmail", () => {
  describe("GIVEN an account email", () => {
    test("WHEN it is rendered THEN the cinema ground is a background colour of its own AND both radial layers sit over it", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      expect(html).toContain("background-color:#08080b");
      expect(html).toContain("radial-gradient(90% 80% at 80% 0%");
      expect(html).toContain("radial-gradient(45% 40% at 78% 10%");
    });

    test("WHEN it is rendered THEN a black letterbox bar frames the content above AND below", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      expect(html.split("background-color:#000000").length - 1).toBe(2);
      expect(html).toContain("text-align:center");
    });

    test("WHEN it is rendered THEN the wordmark prints with its gold middle dot", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      expect(html).toContain("ENGLISH");
      expect(html).toContain("COURSE");
      expect(html).toContain("color:#e7b64c");
    });

    test("WHEN it is rendered THEN it declares a dark colour scheme so no client inverts it", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      expect(html).toContain('name="color-scheme" content="dark"');
      expect(html).toContain('name="supported-color-schemes" content="dark"');
    });
  });

  describe("GIVEN a routine action", () => {
    test("WHEN it is rendered THEN its call to action is the gold primary", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
          action="routine"
        />,
      );

      // Assert
      expect(html).toContain("background-color:#e7b64c");
      expect(html).toContain("color:#1a1200");
    });

    test("WHEN no action is declared THEN it is treated as routine", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      expect(html).toContain("background-color:#e7b64c");
    });
  });

  describe("GIVEN a destructive action", () => {
    test("WHEN it is rendered THEN its call to action carries the destructive fill, border AND label", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
          action="destructive"
        />,
      );

      // Assert
      expect(html).toContain("background-color:#331512");
      expect(html).toContain("1px solid #b3402f");
      expect(html).toContain("color:#ef9d8c");
    });

    test("WHEN it is rendered THEN no gold button appears in the message", async () => {
      // Arrange
      const url = faker.internet.url();

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
          action="destructive"
        />,
      );

      // Assert
      expect(html).not.toContain("background-color:#e7b64c");
    });
  });
});
