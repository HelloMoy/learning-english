import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "react-email";

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
 * What every account email renders from: its language, its copy, and the one
 * link it exists to deliver.
 *
 * @category Email
 */
export type AccountEmailProps = {
  lang: string;
  copy: AccountEmailCopy;
  url: string;
};

/**
 * The shared shape of the account emails: a heading, one paragraph, one
 * button, the same link printed as text for clients that hide buttons, and a
 * closing line saying what happens if the email is ignored.
 *
 * @category Email
 */
export function AccountEmail({ lang, copy, url }: AccountEmailProps) {
  return (
    <Html
      lang={lang}
      dir="ltr"
    >
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>{copy.heading}</Heading>
          <Text style={styles.text}>{copy.body}</Text>
          <Button
            href={url}
            style={styles.button}
          >
            {copy.button}
          </Button>
          <Text style={styles.muted}>{copy.linkIntro}</Text>
          <Link
            href={url}
            style={styles.link}
          >
            {url}
          </Link>
          <Hr style={styles.rule} />
          <Text style={styles.muted}>{copy.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#f6f1e6", fontFamily: "Helvetica, Arial, sans-serif", margin: 0 },
  container: {
    backgroundColor: "#ffffff",
    margin: "32px auto",
    maxWidth: "480px",
    padding: "32px",
  },
  heading: { color: "#08080b", fontSize: "24px", margin: "0 0 16px" },
  text: { color: "#1f1f24", fontSize: "16px", lineHeight: "24px" },
  button: {
    backgroundColor: "#08080b",
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "16px",
    padding: "12px 20px",
    textDecoration: "none",
  },
  muted: { color: "#5b5b66", fontSize: "14px", lineHeight: "20px" },
  link: { color: "#1f1f24", fontSize: "14px", wordBreak: "break-all" as const },
  rule: { borderColor: "#e5e1d8", margin: "24px 0" },
};
