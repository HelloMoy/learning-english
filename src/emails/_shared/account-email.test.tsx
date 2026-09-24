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

    test("WHEN it is rendered THEN both letterbox bars are also painted by a one-colour gradient AND so survive an inversion that spares images", async () => {
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
      expect(html.split("linear-gradient(#000000,#000000)").length - 1).toBe(2);
    });

    test("WHEN it is rendered THEN the rule is a painted block rather than a border AND so survives an inversion that spares images", async () => {
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
      expect(html).toContain("linear-gradient(#26262f,#26262f)");
      expect(html).not.toContain("solid #26262f");
    });

    test("WHEN it is rendered THEN a stylesheet only Gmail matches blends screen over difference on black AND the body carries the class it selects", async () => {
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
      expect(html).toMatch(
        /u \+ \.body \.gmail-screen\s*\{\s*background:\s*#000000;\s*mix-blend-mode:\s*screen;\s*display:\s*block;?\s*\}/,
      );
      expect(html).toMatch(
        /u \+ \.body \.gmail-difference\s*\{\s*background:\s*#000000;\s*mix-blend-mode:\s*difference;\s*display:\s*block;?\s*\}/,
      );
      expect(html).toMatch(/<body class="[^"]*\bbody\b/);
    });

    test("WHEN it is rendered THEN the wordmark's layers stay inline so its gold dot keeps its place between the words", async () => {
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
      expect(html).toMatch(
        /u \+ \.body \.cinema-wordmark \.gmail-screen,\s*u \+ \.body \.cinema-wordmark \.gmail-difference\s*\{\s*display:\s*inline-block;?\s*\}/,
      );
      expect(html).toMatch(/class="[^"]*\bcinema-wordmark\b/);
    });

    test("WHEN it is rendered THEN the wordmark letters, heading, body AND fine print each sit in a screen layer over a difference layer", async () => {
      // Arrange
      const url = faker.internet.url();
      const shielded = (text: string) =>
        `<span class="gmail-screen"><span class="gmail-difference">${text}</span></span>`;

      // Act
      const html = await render(
        <AccountEmail
          lang="en"
          copy={copy}
          url={url}
        />,
      );

      // Assert
      for (const text of [
        "ENGLISH",
        "COURSE",
        copy.heading,
        copy.body,
        copy.linkIntro,
        copy.ignore,
      ]) {
        expect(html).toContain(shielded(text));
      }
    });

    test("WHEN it is rendered THEN the coloured link AND gold dot are left out of the blend layers, which would flip their hue", async () => {
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
      expect(html).not.toContain(`<span class="gmail-difference">${url}`);
      expect(html).not.toContain('<span class="gmail-difference">·');
    });

    test.each([
      ["cinema-foreground", "#f4f1ea"],
      ["cinema-muted", "#9b968c"],
      ["cinema-link", "#d9a37a"],
      ["cinema-gold", "#e7b64c"],
    ])(
      "WHEN Outlook re-maps text colours THEN [data-ogsc] restores the text classed %s to %s",
      async (className, color) => {
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
        expect(html).toContain(`[data-ogsc] .${className} { color: ${color} !important; }`);
        expect(html).toMatch(new RegExp(`class="[^"]*\\b${className}\\b`));
      },
    );

    test.each([
      ["cinema-ground", "#08080b"],
      ["cinema-letterbox", "#000000"],
      ["cinema-rule", "#26262f"],
    ])(
      "WHEN Outlook re-maps backgrounds THEN [data-ogsb] restores the fill classed %s to %s",
      async (className, color) => {
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
        expect(html).toContain(
          `[data-ogsb] .${className} { background-color: ${color} !important; }`,
        );
        expect(html).toMatch(new RegExp(`class="[^"]*\\b${className}\\b`));
      },
    );

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

    test("WHEN it is rendered THEN it declares its dark colour scheme to the clients that honour one", async () => {
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

    test("WHEN it is rendered THEN its fill is a colour only AND its label sits outside every blend layer, so it inverts as a unit", async () => {
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
      expect(html).not.toContain("linear-gradient(#e7b64c");
      expect(html).not.toContain(`<span class="gmail-difference">${copy.button}`);
    });

    test("WHEN Outlook re-maps colours THEN the gold fill AND its dark label are restored", async () => {
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
      expect(html).toContain(
        "[data-ogsb] .cinema-gold-button { background-color: #e7b64c !important; }",
      );
      expect(html).toContain("[data-ogsc] .cinema-gold-button { color: #1a1200 !important; }");
      expect(html).toMatch(/class="[^"]*\bcinema-gold-button\b/);
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

    test("WHEN it is rendered THEN its fill is a colour only AND so inverts together with its label", async () => {
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
      expect(html).not.toContain("linear-gradient(#331512");
    });

    test("WHEN it is rendered THEN its coloured label is left out of every blend layer", async () => {
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
      expect(html).not.toContain(`<span class="gmail-difference">${copy.button}`);
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
