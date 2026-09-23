import type { CSSProperties } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

/**
 * The translated lines of an account email, in reading order. Templates
 * receive copy already translated: rendering happens outside any request, so
 * there is no intl context to translate from.
 *
 * @category Email
 */
export type AccountEmailCopy = {
  preview: string;
  heading: string;
  body: string;
  button: string;
  linkIntro: string;
  ignore: string;
};

/**
 * What the email's one link does, which decides how its button is painted.
 *
 * @remarks
 * `routine` is anything the learner can do again — confirming an address,
 * choosing a new password — and wears the gold primary. `destructive` is a
 * link that cannot be taken back, and wears the destructive treatment so it
 * never looks like a reward. The template declares this, not the caller: the
 * fact that deletion is irreversible belongs to the delete template.
 *
 * @category Email
 */
export type AccountEmailAction = "routine" | "destructive";

/**
 * What every account email renders from: its language, its copy, the one link
 * it exists to deliver, and what following that link does.
 *
 * @category Email
 */
export type AccountEmailProps = {
  lang: string;
  copy: AccountEmailCopy;
  url: string;
  /** Defaults to `routine`. */
  action?: AccountEmailAction;
};

/**
 * The shared shape of the account emails, drawn in the Immersion Cinema dark
 * palette: black letterbox bars cropping the cinema gradient into a film
 * frame, and centred between them the wordmark, a heading, one paragraph, one
 * button, the same link printed as text for clients that hide buttons, and a
 * closing line saying what happens if the email is ignored.
 *
 * @remarks
 * The palette is baked rather than themed. An email cannot read the learner's
 * stored theme, and `cinema-theme-tokens` makes dark the variant the product
 * serves by default, so dark is what the message commits to.
 *
 * @category Email
 */
export function AccountEmail({ lang, copy, url, action = "routine" }: AccountEmailProps) {
  return (
    <Html
      lang={lang}
      dir="ltr"
    >
      <Head>
        {/* Without these, Gmail and Outlook.com re-map an already-dark palette. */}
        <meta
          name="color-scheme"
          content="dark"
        />
        <meta
          name="supported-color-schemes"
          content="dark"
        />
      </Head>
      <Preview>{copy.preview}</Preview>
      <Body style={styles.page}>
        <Section style={styles.letterboxBar}>&nbsp;</Section>
        <Container style={styles.frame}>
          <Text style={styles.wordmark}>
            ENGLISH<span style={styles.wordmarkDot}>·</span>COURSE
          </Text>
          <Heading style={styles.heading}>{copy.heading}</Heading>
          <Text style={styles.paragraph}>{copy.body}</Text>
          <Button
            href={url}
            style={{ ...styles.callToAction, ...CALL_TO_ACTION_COLORS[action] }}
          >
            {copy.button}
          </Button>
          <Text style={styles.finePrint}>{copy.linkIntro}</Text>
          <Link
            href={url}
            style={styles.link}
          >
            {url}
          </Link>
          <Hr style={styles.rule} />
          <Text style={styles.finePrint}>{copy.ignore}</Text>
        </Container>
        <Section style={styles.letterboxBar}>&nbsp;</Section>
      </Body>
    </Html>
  );
}

const CALL_TO_ACTION_COLORS: Record<AccountEmailAction, CSSProperties> = {
  routine: { backgroundColor: "#e7b64c", border: "1px solid #e7b64c", color: "#1a1200" },
  destructive: { backgroundColor: "#331512", border: "1px solid #b3402f", color: "#ef9d8c" },
};

/*
 * Every literal below is a token from the `.dark` block of `globals.css`,
 * named in the comment beside it. Mail clients resolve neither custom
 * properties nor `color-mix()`, so the values are written out — change one
 * here only when the token behind it moves.
 *
 * The two gradients are `CinemaBackground`'s, with its `color-mix()` resolved:
 * `--glow #f0c869` at 16% over `--background #08080b` is `#2d271a`, and the
 * focal layer's 24% is the same glow at that alpha. They ride on top of a
 * `background-color`, so a client that drops background images renders flat
 * near-black instead of falling back to white.
 */
const styles = {
  page: {
    backgroundColor: "#08080b", // --background
    backgroundImage:
      "radial-gradient(45% 40% at 78% 10%, rgba(240,200,105,0.24), rgba(240,200,105,0) 70%), radial-gradient(90% 80% at 80% 0%, #2d271a, #08080b 62%)",
    fontFamily: "Geist, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: 0,
  },
  letterboxBar: {
    backgroundColor: "#000000", // --letterbox
    fontSize: "0",
    height: "26px",
    lineHeight: "26px",
  },
  frame: {
    margin: "0 auto",
    maxWidth: "480px",
    padding: "40px 32px 44px",
    textAlign: "center" as const,
  },
  wordmark: {
    color: "#f4f1ea", // --foreground
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.24em",
    margin: "0 0 28px",
  },
  wordmarkDot: { color: "#e7b64c", padding: "0 2px" }, // --gold
  heading: {
    color: "#f4f1ea", // --foreground
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: "32px",
    margin: "0 0 12px",
  },
  paragraph: {
    color: "#f4f1ea", // --foreground
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 28px",
  },
  callToAction: {
    borderRadius: "10px", // --radius
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "13px 22px",
    textDecoration: "none",
  },
  finePrint: {
    color: "#9b968c", // --muted-foreground
    fontSize: "13px",
    lineHeight: "20px",
    margin: "28px 0 6px",
  },
  link: {
    color: "#d9a37a", // --bronze-text
    fontSize: "13px",
    wordBreak: "break-all" as const,
  },
  /* `Hr` defaults `borderTop` to `#eaeaea`, so the colour has to be set there
     rather than through `borderColor`, which it would ignore. */
  rule: { borderTop: "1px solid #26262f", margin: "28px 0 0" }, // --border
};
