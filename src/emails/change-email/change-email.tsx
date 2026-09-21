import { AccountEmail, type AccountEmailProps } from "../_shared/account-email";
import messages from "../../messages/en.json";

/**
 * The email that approves moving an account to a different address. It goes
 * to the address the account holds today, names the one it would move to, and
 * only asks that new address to confirm once this link is opened.
 *
 * @remarks
 * A routine action, so its button wears the gold primary: ignoring this email
 * leaves the address exactly as it was, and a learner who wants the change can
 * ask for the link again.
 *
 * @category Email
 */
export default function ChangeEmail(props: AccountEmailProps) {
  return <AccountEmail {...props} />;
}

ChangeEmail.PreviewProps = {
  lang: "en",
  copy: {
    ...messages.Emails.ChangeEmail,
    body: messages.Emails.ChangeEmail.body.replace("{newEmail}", "ana.g@example.com"),
  },
  url: "http://localhost:3000/api/auth/verify-email?token=preview&callbackURL=%2Fen%2Fprofile",
} satisfies AccountEmailProps;
