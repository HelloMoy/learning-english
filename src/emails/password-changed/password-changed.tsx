import { AccountEmail, type AccountEmailProps } from "../_shared/account-email";
import messages from "../../messages/en.json";

/**
 * The email that tells a learner their password was replaced.
 *
 * @remarks
 * The only account email whose reader might not be the person who caused it,
 * which decides everything about it: it carries no reset token, and its link
 * opens the forgot-password page, where a new key is mailed to the address.
 * Someone reading a stolen inbox gains nothing from it; the account's owner
 * gains a way back in.
 *
 * A routine action, so the button wears the gold primary — what it offers is
 * the ordinary recovery route, not a further loss.
 *
 * @category Email
 */
export default function PasswordChanged(props: AccountEmailProps) {
  return <AccountEmail {...props} />;
}

PasswordChanged.PreviewProps = {
  lang: "en",
  copy: messages.Emails.PasswordChanged,
  url: "http://localhost:3000/en/forgot-password",
} satisfies AccountEmailProps;
