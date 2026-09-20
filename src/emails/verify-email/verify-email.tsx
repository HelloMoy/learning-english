import { AccountEmail, type AccountEmailProps } from "../_shared/account-email";
import messages from "../../messages/en.json";

/**
 * The email that confirms a new account's address. Following its link
 * verifies the address and signs the learner in.
 *
 * @category Email
 */
export default function VerifyEmail(props: AccountEmailProps) {
  return <AccountEmail {...props} />;
}

VerifyEmail.PreviewProps = {
  lang: "en",
  copy: messages.Emails.VerifyEmail,
  url: "http://localhost:3000/api/auth/verify-email?token=preview&callbackURL=%2Fen%2Flearning",
} satisfies AccountEmailProps;
