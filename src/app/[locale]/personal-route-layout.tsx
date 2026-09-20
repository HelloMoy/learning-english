import { requireLearnerSession } from "@/lib/auth/require-learner-session/require-learner-session";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * The layout every personal route segment shares: it validates the session on
 * the server before the page renders, and redirects to sign-in otherwise.
 *
 * My learning, Achievements, Profile and the onboarding re-export it as their
 * `layout.tsx`; the course routes compose it with their profile gate.
 */
export default async function PersonalRouteLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireLearnerSession(locale);
  return <>{children}</>;
}
