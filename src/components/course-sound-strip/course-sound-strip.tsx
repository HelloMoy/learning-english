import { CourseSection } from "@/components/course-section/course-section";
import type { CourseSounds } from "@/domain/entities/course/course";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";

/** Props for {@link CourseSoundStrip}. */
export type CourseSoundStripProps = {
  /** The IPA sounds the course teaches, as its manifest declares them. */
  sounds: CourseSounds;
};

/**
 * The sounds a course teaches, counted in the heading and laid out as two
 * groups of IPA symbols: vowels, then consonants.
 *
 * @remarks
 * Each group is a list named by its visible label, so the split between vowels
 * and consonants is stated in text; the gold outline on vowels only repeats
 * it. A course that declares no sounds renders nothing.
 *
 * @example
 * ```tsx
 * {course.sounds ? <CourseSoundStrip sounds={course.sounds} /> : null}
 * ```
 */
export function CourseSoundStrip({ sounds }: CourseSoundStripProps) {
  const t = useTranslations("Components.CourseSoundStrip");
  const count = sounds.vowels.length + sounds.consonants.length;
  if (count === 0) return null;

  return (
    <CourseSection
      eyebrow={t("eyebrow")}
      heading={t("heading", { count })}
    >
      <div className="flex flex-col gap-4">
        <SoundGroup
          label={t("vowels")}
          symbols={sounds.vowels}
          isVowel
        />
        <SoundGroup
          label={t("consonants")}
          symbols={sounds.consonants}
        />
      </div>
    </CourseSection>
  );
}

function SoundGroup({
  label,
  symbols,
  isVowel = false,
}: {
  label: string;
  symbols: ReadonlyArray<string>;
  isVowel?: boolean;
}) {
  if (symbols.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span
        aria-hidden="true"
        className="text-[0.6875rem] font-bold tracking-[0.2em] text-muted-foreground uppercase"
      >
        {label}
      </span>
      <ul
        aria-label={label}
        className="flex flex-wrap gap-1.5"
      >
        {symbols.map((symbol) => (
          <li
            key={symbol}
            className={cn(
              "min-w-10 rounded-[9px] border bg-card px-2.5 py-1 text-center text-base font-extrabold text-foreground",
              isVowel ? "border-primary/60" : "border-border",
            )}
          >
            {symbol}
          </li>
        ))}
      </ul>
    </div>
  );
}
