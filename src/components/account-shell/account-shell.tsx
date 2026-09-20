/**
 * Props for {@link AccountShell}.
 */
export type AccountShellProps = {
  /** The page's level-1 heading. */
  title: string;
  /** One line under the heading saying what the page is for. */
  subtitle?: string;
  /** The form, or the confirmation that replaced it. */
  children: React.ReactNode;
  /** Links to the neighbouring account pages, under the card's content. */
  footer?: React.ReactNode;
};

/**
 * The card every account page is built in: sign-in, sign-up, forgot and reset
 * password. A heading, an optional subtitle, the page's content, and a footer
 * for the links between those pages.
 *
 * @example
 * ```tsx
 * <AccountShell title={t("title")} subtitle={t("subtitle")} footer={<Link href="/sign-up">…</Link>}>
 *   <SignInForm returnPath="/learning" />
 * </AccountShell>
 * ```
 */
export function AccountShell({ title, subtitle, children, footer }: AccountShellProps) {
  return (
    <section className="mx-auto flex w-full max-w-[26rem] flex-col gap-6 rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-sans text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance text-foreground">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-pretty text-muted-foreground">{subtitle}</p> : null}
      </header>
      {children}
      {footer ? (
        <footer className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
