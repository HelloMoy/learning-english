import { AccountEmail, type AccountEmailProps } from "../_shared/account-email";
import messages from "../../messages/en.json";

/**
 * The email that carries a password-reset link. Following it opens the page
 * where the learner chooses a new password.
 *
 * @category Email
 */
export default function ResetPassword(props: AccountEmailProps) {
  return <AccountEmail {...props} />;
}

ResetPassword.PreviewProps = {
  lang: "en",
  copy: messages.Emails.ResetPassword,
  url: "http://localhost:3000/api/auth/reset-password/preview?callbackURL=%2Fen%2Freset-password",
} satisfies AccountEmailProps;
