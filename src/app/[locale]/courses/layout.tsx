import { RequireLearnerProfile } from "./require-learner-profile";

type Props = {
  children: React.ReactNode;
};

/**
 * Wraps every course, module and lesson route. The course itself still renders
 * on the server; the gate decides after hydration whether this device needs
 * the onboarding first.
 */
export default function CoursesLayout({ children }: Props) {
  return (
    <>
      <RequireLearnerProfile />
      {children}
    </>
  );
}
