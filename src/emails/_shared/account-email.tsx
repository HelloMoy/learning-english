import type { CSSProperties, ReactNode } from "react";
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
 * Declaring `color-scheme: dark` does not stop every client from inverting
 * it. The Gmail app on iOS inverts every colour but spares background images,
 * so the fills that must not flip are also painted as one-colour gradients,
 * and an embedded stylesheet that only Gmail matches blends the light text
 * back to its colours; the buttons invert as a unit and still read. The same
 * stylesheet gives the Outlook clients that mark what they re-map with
 * `data-ogsc` and `data-ogsb` the colours to restore. The Outlook app on iOS
 * honours neither: it re-maps every tinted colour and draws no gradient, so
 * the dark fills are neutral grays and the glow is also a hosted image.
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
        {/* Apple Mail honours these; Gmail ignores them, hence the stylesheet below. */}
        <meta
          name="color-scheme"
          content="dark"
        />
        <meta
          name="supported-color-schemes"
          content="dark"
        />
        <style>{GMAIL_INVERSION_DEFENCE + OUTLOOK_INVERSION_DEFENCE}</style>
      </Head>
      <Preview>{copy.preview}</Preview>
      <Body
        className="body cinema-ground"
        style={styles.page}
      >
        <Section style={glowImageLayer(url)}>
          <Section
            className="cinema-letterbox"
            style={styles.letterboxBar}
          >
            &nbsp;
          </Section>
          <Container style={styles.frame}>
            <Text
              className="cinema-foreground cinema-wordmark"
              style={styles.wordmark}
            >
              <KeptLightInGmail>ENGLISH</KeptLightInGmail>
              <span
                className="cinema-gold"
                style={styles.wordmarkDot}
              >
                ·
              </span>
              <KeptLightInGmail>COURSE</KeptLightInGmail>
            </Text>
            <Heading
              className="cinema-foreground"
              style={styles.heading}
            >
              <KeptLightInGmail>{copy.heading}</KeptLightInGmail>
            </Heading>
            <Text
              className="cinema-foreground"
              style={styles.paragraph}
            >
              <KeptLightInGmail>{copy.body}</KeptLightInGmail>
            </Text>
            <Button
              className={CALL_TO_ACTION[action].className}
              href={url}
              style={{ ...styles.callToAction, ...CALL_TO_ACTION[action].colors }}
            >
              {copy.button}
            </Button>
            <Text
              className="cinema-muted"
              style={styles.finePrint}
            >
              <KeptLightInGmail>{copy.linkIntro}</KeptLightInGmail>
            </Text>
            <Link
              className="cinema-link"
              href={url}
              style={styles.link}
            >
              {url}
            </Link>
            <Hr
              className="cinema-rule"
              style={styles.rule}
            />
            <Text
              className="cinema-muted"
              style={styles.finePrint}
            >
              <KeptLightInGmail>{copy.ignore}</KeptLightInGmail>
            </Text>
          </Container>
          <Section
            className="cinema-letterbox"
            style={styles.letterboxBar}
          >
            &nbsp;
          </Section>
        </Section>
      </Body>
    </Html>
  );
}

/** Wraps light neutral text in the layers `GMAIL_INVERSION_DEFENCE` blends. */
function KeptLightInGmail({ children }: { children: ReactNode }) {
  return (
    <span className="gmail-screen">
      <span className="gmail-difference">{children}</span>
    </span>
  );
}

/*
 * The literals in `CINEMA` with a token beside them come from the `.dark` block
 * of `globals.css`; the rest are the email's own. Mail clients resolve neither custom
 * properties nor `color-mix()`, so the values are written out — change one
 * here only when the token behind it moves.
 *
 * The fills that must stay dark are neutral grays, a hair off their tokens:
 * the Outlook app on iOS leaves a neutral gray alone in dark mode but re-maps
 * any tinted colour, however dark — `#08080b` comes back as `#4c4c4e`.
 *
 * `glowWash` and the focal layer's alpha are `CinemaBackground`'s gradients
 * with their `color-mix()` resolved: `--glow #f0c869` at 16% over the
 * ground is `#2d2718`, and the focal layer is the same glow at 24%.
 */
const CINEMA = {
  ground: "#080808", // --background #08080b, untinted
  letterbox: "#000000", // --letterbox
  foreground: "#f4f1ea", // --foreground
  mutedForeground: "#9b968c", // --muted-foreground
  gold: "#e7b64c", // --gold
  onGold: "#1a1200", // --primary-foreground
  bronzeText: "#d9a37a", // --bronze-text
  border: "#262626", // --border #26262f, untinted
  destructiveFill: "#331512",
  destructive: "#b3402f", // --destructive
  destructiveLabel: "#ef9d8c",
  glowWash: "#2d2718",
  glowFocal: "rgba(240,200,105,0.24)",
  glowFaded: "rgba(240,200,105,0)",
} as const;

/* The Gmail app on iOS inverts every colour in dark mode but never a
   background image, so a fill that must not flip is painted twice: as an image
   for Gmail, and as a colour for clients that drop images. */
function solidFill(color: string): CSSProperties {
  return { backgroundColor: color, backgroundImage: `linear-gradient(${color},${color})` };
}

/*
 * The Outlook app on iOS draws no CSS gradient but does draw a `url()`, so the
 * glow is also a bitmap of the page's two radial layers, baked over the ground.
 * Stretched to its box it scales exactly as the percentage gradients do, and
 * being opaque it hides them where it loads. It sits alone on its layer
 * because Gmail's web client drops a whole `style` holding a `url()`: there
 * only the image goes, and the gradients beneath remain. The address comes
 * from the email's own link, so the image loads from the deployment that sent
 * it.
 */
const GLOW_IMAGE_PATH = "/emails/cinema-glow.png";

function glowImageLayer(actionUrl: string): CSSProperties {
  return {
    backgroundImage: `url(${new URL(GLOW_IMAGE_PATH, actionUrl).href})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
  };
}

/*
 * Gmail replaces the doctype with a `<u>` right before the body, so
 * `u + .body` matches in Gmail and nowhere else. Its iOS app inverts the text
 * and the black of these layers alike; `difference` against the inverted
 * outer layer turns the text back, and `screen` lays the result over the
 * frame with the black dropping out. Only neutral text survives the trip:
 * `difference` flips hue, which Gmail's own inversion keeps.
 *
 * Where a layer's edge falls on a fraction of a pixel, the two layers blend
 * only partly and the inverted black shows as a hairline. As blocks, the
 * layers take the frame's whole-pixel edges; the wordmark alone stays inline,
 * so its gold dot keeps its place between the words.
 */
const GMAIL_INVERSION_DEFENCE = `
u + .body .gmail-screen { background: #000000; mix-blend-mode: screen; display: block; }
u + .body .gmail-difference { background: #000000; mix-blend-mode: difference; display: block; }
u + .body .cinema-wordmark .gmail-screen, u + .body .cinema-wordmark .gmail-difference { display: inline-block; }
`;

/*
 * Both buttons stay plain colour on purpose. A label cannot be blended back
 * without hairlines on the fill, so in a client that inverts colours the fill
 * and its label invert together — a dark gold button with a light label, or a
 * light warning button with a dark one — and still read.
 */
const CALL_TO_ACTION: Record<AccountEmailAction, { className?: string; colors: CSSProperties }> = {
  routine: {
    className: "cinema-gold-button",
    colors: {
      backgroundColor: CINEMA.gold,
      border: `1px solid ${CINEMA.gold}`,
      color: CINEMA.onGold,
    },
  },
  destructive: {
    colors: {
      backgroundColor: CINEMA.destructiveFill,
      border: `1px solid ${CINEMA.destructive}`,
      color: CINEMA.destructiveLabel,
    },
  },
};

/*
 * Outlook.com and the Outlook apps mark what they re-map in dark mode with
 * `data-ogsc` (text) and `data-ogsb` (background), so these put the cinema
 * colours back on every element carrying the class.
 */
const OUTLOOK_TEXT_COLORS = {
  "cinema-foreground": CINEMA.foreground,
  "cinema-muted": CINEMA.mutedForeground,
  "cinema-link": CINEMA.bronzeText,
  "cinema-gold": CINEMA.gold,
  "cinema-gold-button": CINEMA.onGold,
};

const OUTLOOK_FILL_COLORS = {
  "cinema-ground": CINEMA.ground,
  "cinema-letterbox": CINEMA.letterbox,
  "cinema-rule": CINEMA.border,
  "cinema-gold-button": CINEMA.gold,
};

const OUTLOOK_INVERSION_DEFENCE = [
  ...Object.entries(OUTLOOK_TEXT_COLORS).map(
    ([className, color]) => `[data-ogsc] .${className} { color: ${color} !important; }`,
  ),
  ...Object.entries(OUTLOOK_FILL_COLORS).map(
    ([className, color]) => `[data-ogsb] .${className} { background-color: ${color} !important; }`,
  ),
].join("\n");

/* The gradients ride on top of a `background-color`, so a client that drops
   background images renders flat near-black instead of falling back to white. */
const styles = {
  page: {
    backgroundColor: CINEMA.ground,
    backgroundImage: `radial-gradient(45% 40% at 78% 10%, ${CINEMA.glowFocal}, ${CINEMA.glowFaded} 70%), radial-gradient(90% 80% at 80% 0%, ${CINEMA.glowWash}, ${CINEMA.ground} 62%)`,
    fontFamily: "Geist, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: 0,
  },
  letterboxBar: {
    ...solidFill(CINEMA.letterbox),
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
    color: CINEMA.foreground,
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.24em",
    margin: "0 0 28px",
  },
  wordmarkDot: { color: CINEMA.gold, padding: "0 2px" },
  heading: {
    color: CINEMA.foreground,
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: "32px",
    margin: "0 0 12px",
  },
  paragraph: {
    color: CINEMA.foreground,
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
    color: CINEMA.mutedForeground,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "28px 0 6px",
  },
  link: {
    color: CINEMA.bronzeText,
    fontSize: "13px",
    wordBreak: "break-all" as const,
  },
  /* A border cannot be painted as an image, so the rule is a 1px block
     instead; `Hr` defaults `borderTop` to `#eaeaea`, which is why it is
     cleared there rather than through `border`. */
  rule: { ...solidFill(CINEMA.border), borderTop: "none", height: "1px", margin: "28px 0 0" },
};
