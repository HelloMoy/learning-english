import { Eyebrow } from "@/components/eyebrow/eyebrow";

/**
 * The Immersion Cinema home hero: an eyebrow kicker, an oversized display
 * title, and a short subtitle.
 *
 * @remarks
 * It carries no call to action. It used to own two — "Open course" and a
 * "+ My List" placeholder — which made sense while the home was a cover for
 * one course. Now the page's one primary action is `Resume` in the
 * continue-watching panel and every course card carries its own; a third
 * button competing from the hero would leave a learner with no obvious next
 * step.
 *
 * Presentational — copy is passed in by the page.
 */
export function CinemaHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <Eyebrow>{eyebrow}</Eyebrow>
      {/*
        `text-balance` keeps the display size from stranding a one-word last
        line: at 72px the headline wraps, and an orphan reads as a mistake.
      */}
      <h1 className="font-sans text-6xl leading-[0.98] font-extrabold tracking-tight text-balance text-foreground sm:text-7xl">
        {title}
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
    </section>
  );
}
