import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Eyebrow } from "../../../src/components/eyebrow/eyebrow";
import { GoldBadge } from "../../../src/components/gold-badge/gold-badge";
import { PosterCard } from "../../../src/components/poster-card/poster-card";

const SIDEBAR_GROUPS = [
  { key: "cinema", prefix: "Cinema/" },
  { key: "lessonView", prefix: "LessonView/" },
  { key: "components", prefix: "Components/" },
  { key: "ui", prefix: "UI/" },
] as const;

const SHIPPING_RULES = ["story", "locales", "test", "jsdoc"] as const;
const REVIEW_STEPS = ["locales", "themes", "a11y"] as const;

const code = (chunks: React.ReactNode) => <code>{chunks}</code>;

/**
 * The workshop's home page (`Docs/Welcome`): it presents Storybook as the design
 * system for English Course, the way the API reference's home presents itself,
 * then maps the sidebar and lists what a component needs before it ships.
 *
 * Copy comes from `Stories.Docs.Welcome` in `.storybook/messages`, so it follows
 * the toolbar's locale through `CinemaDocsContainer`.
 */
export function WelcomePage() {
  return (
    <div className="cinema-docs">
      <Hero />
      <SidebarGroups />
      <ShippingRules />
      <ReviewSteps />
    </div>
  );
}

function Hero() {
  const t = useTranslations("Stories.Docs.Welcome");

  return (
    <header className="cinema-docs__hero">
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="cinema-docs__title">
        {t.rich("headline", {
          accent: (chunks) => <span className="cinema-docs__title-accent">{chunks}</span>,
        })}
      </h1>
      <p className="cinema-docs__lead">{t("lead")}</p>
      <div className="cinema-docs__chips">
        <GoldBadge>{t("chips.system")}</GoldBadge>
        <GoldBadge variant="neutral">{t("chips.locales")}</GoldBadge>
        <GoldBadge variant="neutral">{t("chips.themes")}</GoldBadge>
      </div>
    </header>
  );
}

function SidebarGroups() {
  const t = useTranslations("Stories.Docs.Welcome");

  return (
    <section
      className="cinema-docs__section"
      aria-labelledby="where-things-live"
    >
      <div className="cinema-docs__section-head">
        <div>
          <Eyebrow>{t("browse.eyebrow")}</Eyebrow>
          <h2
            id="where-things-live"
            className="cinema-docs__heading"
          >
            {t("browse.heading")}
          </h2>
        </div>
        <p className="cinema-docs__note">{t("browse.note")}</p>
      </div>
      <div className="cinema-docs__shelves">
        {SIDEBAR_GROUPS.map(({ key, prefix }) => (
          <PosterCard
            key={key}
            eyebrow={t(`groups.${key}.name`)}
            headline={prefix}
            title={t(`groups.${key}.holds`)}
            showPlay={false}
            aspect="wide"
          />
        ))}
      </div>
    </section>
  );
}

function ShippingRules() {
  const t = useTranslations("Stories.Docs.Welcome.ships");

  return (
    <section
      className="cinema-docs__section"
      aria-labelledby="before-it-ships"
    >
      <h2
        id="before-it-ships"
        className="cinema-docs__heading"
      >
        {t("heading")}
      </h2>
      <ul className="cinema-docs__checklist cinema-docs__checklist--pairs">
        {SHIPPING_RULES.map((rule) => (
          <ChecklistItem
            key={rule}
            rule={t(`${rule}.rule`)}
            detail={t.rich(`${rule}.detail`, { code })}
          />
        ))}
      </ul>
    </section>
  );
}

function ReviewSteps() {
  const t = useTranslations("Stories.Docs.Welcome.review");

  return (
    <section
      className="cinema-docs__section"
      aria-labelledby="reviewing"
    >
      <h2
        id="reviewing"
        className="cinema-docs__heading"
      >
        {t("heading")}
      </h2>
      <ul className="cinema-docs__checklist">
        {REVIEW_STEPS.map((step) => (
          <ChecklistItem
            key={step}
            rule={t(`${step}.rule`)}
            detail={t(`${step}.detail`)}
          />
        ))}
      </ul>
      <p className="cinema-docs__note">{t("closing")}</p>
    </section>
  );
}

function ChecklistItem({ rule, detail }: { rule: string; detail: React.ReactNode }) {
  return (
    <li className="cinema-docs__check">
      <Check aria-hidden="true" />
      <span>
        <strong>{rule}</strong>
        {detail}
      </span>
    </li>
  );
}
