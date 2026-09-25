import { Typeset } from "@storybook/addon-docs/blocks";
import { useTranslations } from "next-intl";

import { Eyebrow } from "../../../src/components/eyebrow/eyebrow";

const SANS = "var(--font-geist-sans)";
const MONO = "var(--font-geist-mono)";
// Phonetic symbols and a timecode: the characters Geist Mono is there for.
const MONO_SAMPLE = "/ɪ/ vs /iː/ · 04:12";

const code = (chunks: React.ReactNode) => <code>{chunks}</code>;

/** `Docs/Typography`: Geist and Geist Mono as the app sets them, and the eyebrow. */
export function TypographyPage() {
  const t = useTranslations("Stories.Docs.Typography");

  return (
    <div className="cinema-docs">
      <header className="cinema-docs__hero">
        <h1 className="cinema-docs__page-title">{t("title")}</h1>
        <p className="cinema-docs__body">{t.rich("intro", { code })}</p>
      </header>

      <section className="cinema-docs__section">
        <h2 className="cinema-docs__heading">Geist</h2>
        <p className="cinema-docs__body">{t("sansUse")}</p>
        <Typeset
          fontFamily={SANS}
          fontWeight={800}
          fontSizes={[48, 36, 24, 20]}
          sampleText={t("displaySample")}
        />
        <Typeset
          fontFamily={SANS}
          fontWeight={400}
          fontSizes={[16, 14, 12]}
          sampleText={t("bodySample")}
        />
      </section>

      <section className="cinema-docs__section">
        <h2 className="cinema-docs__heading">Geist Mono</h2>
        <p className="cinema-docs__body">{t("monoUse")}</p>
        <Typeset
          fontFamily={MONO}
          fontWeight={500}
          fontSizes={[24, 14, 12]}
          sampleText={MONO_SAMPLE}
        />
      </section>

      <section className="cinema-docs__section">
        <h2 className="cinema-docs__heading">{t("eyebrowHeading")}</h2>
        <p className="cinema-docs__body">{t.rich("eyebrowUse", { code })}</p>
        <Eyebrow>{t("eyebrowSample")}</Eyebrow>
      </section>
    </div>
  );
}
