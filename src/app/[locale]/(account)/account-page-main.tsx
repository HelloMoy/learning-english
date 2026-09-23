/**
 * The `<main>` landmark every account page renders its card in, centred with
 * room around it on every viewport.
 */
export function AccountPageMain({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main"
      className="flex w-full flex-1 items-start justify-center px-4 py-10 sm:py-16"
    >
      {children}
    </main>
  );
}
