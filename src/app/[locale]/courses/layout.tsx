import { requireLearnerSession } from "@/lib/auth/require-learner-session/require-learner-session";

import { RequireLearnerProfile } from "./require-learner-profile";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Wraps every course, module and lesson route. The session is validated on
 * the server first; the profile gate then decides after hydration whether
 * this learner needs the onboarding.
 */
export default async function CoursesLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireLearnerSession(locale);

  return (
    <>
      <RequireLearnerProfile />
      {children}
    </>
  );
}
