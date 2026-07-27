import { cn } from "@/lib/utils/utils";

/**
 * A small uppercase, letter-spaced gold label — the cinema "eyebrow" used
 * for section chrome and kickers ("Now streaming", "Limited series",
 * "Season 1 · 10 episodes", "Episode 3"). The `--gold` token is contrast
 * safe as text in both themes (design.md §D2).
 */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "h2";
}) {
  return (
    <Tag className={cn("text-xs font-bold tracking-[0.32em] text-gold uppercase", className)}>
      {children}
    </Tag>
  );
}
