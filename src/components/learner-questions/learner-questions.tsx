import { Eyebrow } from "@/components/eyebrow/eyebrow";

import { useFormatter, useTranslations } from "next-intl";

/** The questions, in the order a new visitor tends to ask them. */
const QUESTION_KEYS = ["sounds", "time", "phone"] as const;

/**
 * The new-visitor home's three questions, each answered in a sentence or two.
 *
 * @remarks
 * These are the doubts that stop a visitor before the first lesson: why sounds
 * before grammar, whether a few minutes a day is enough, and whether it works
 * on a phone. The list is numbered because the order is part of the argument.
 */
export function LearnerQuestions() {
  const t = useTranslations("HomePage.questions");
  const format = useFormatter();

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-3 lg:col-span-4">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="font-sans text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("heading")}
        </h2>
      </div>
      <ol className="flex flex-col border-b border-border lg:col-span-8">
        {QUESTION_KEYS.map((key, index) => (
          <li
            key={key}
            className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-t border-border py-6 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6 sm:py-7"
          >
            <span
              data-testid="question-ordinal"
              className="text-2xl font-extrabold text-amber tabular-nums sm:text-3xl"
            >
              {format.number(index + 1, { minimumIntegerDigits: 2 })}
            </span>
            <div className="flex flex-col gap-2.5">
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {t(`items.${key}.question`)}
              </h3>
              <p className="text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
                {t(`items.${key}.answer`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
