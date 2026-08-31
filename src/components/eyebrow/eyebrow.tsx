import { cn } from "@/lib/utils/utils";

/**
 * A small uppercase, letter-spaced gold label — the cinema "eyebrow" used
 * for section chrome and kickers ("Now streaming", "Lesson 3", "Video 1").
 * The `--gold` token is contrast safe as text in both themes (design.md §D2).
 */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
  "data-testid": testId,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "h2";
  "data-testid"?: string;
}) {
  return (
    <Tag
      data-testid={testId}
      className={cn("text-xs font-bold tracking-[0.32em] text-gold uppercase", className)}
    >
      {children}
    </Tag>
  );
}
