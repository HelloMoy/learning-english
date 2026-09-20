import { AccountEmail, type AccountEmailProps } from "../_shared/account-email";
import messages from "../../messages/en.json";

/**
 * The email that confirms deleting an account. Following its link, while
 * signed in, deletes the account and everything the learner saved.
 *
 * @category Email
 */
export default function DeleteAccount(props: AccountEmailProps) {
  return <AccountEmail {...props} />;
}

DeleteAccount.PreviewProps = {
  lang: "en",
  copy: messages.Emails.DeleteAccount,
  url: "http://localhost:3000/api/auth/delete-user/callback?token=preview&callbackURL=%2Fen%2Faccount-deleted",
} satisfies AccountEmailProps;
