import { cn } from "@/lib/utils/utils";

/**
 * A cinema pill/badge. `gold` is the accented variant (counts, "featured");
 * `neutral` is the quiet variant (metadata chips). Purely presentational.
 */
export function GoldBadge({
  children,
  variant = "gold",
  className,
}: {
  children: React.ReactNode;
  variant?: "gold" | "neutral";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        variant === "gold"
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-border bg-foreground/5 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
