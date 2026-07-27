/**
 * The Immersion Cinema backdrop: a warm radial glow bleeding from the
 * upper-right over the base `--background`, plus a subtle top scrim that
 * evokes the mockup's letterbox bar. Rendered once (in the locale layout)
 * as a fixed, `aria-hidden` layer behind all content. The glow is static —
 * no animation — so it is safe under `prefers-reduced-motion`.
 */
export function CinemaBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-background"
    >
      {/* Warm base wash from the top-right corner. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 80% at 80% 0%, color-mix(in oklab, var(--glow) 16%, var(--background)), var(--background) 62%)",
        }}
      />
      {/* Brighter focal glow. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 40% at 78% 10%, color-mix(in oklab, var(--glow) 24%, transparent), transparent 70%)",
        }}
      />
      {/* Letterbox scrim along the top edge. */}
      <div
        className="absolute inset-x-0 top-0 h-16"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--letterbox) 85%, transparent), transparent)",
        }}
      />
    </div>
  );
}
